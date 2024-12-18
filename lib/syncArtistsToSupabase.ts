import { getArtistsTable } from "./airtable";
import { supabaseAdmin } from "./supabase";
import {
  Artist,
  AirtableAttachment,
  StoredAttachment,
  SyncError,
} from "./types";

async function uploadArtistPhotoToSupabase(
  attachment: AirtableAttachment,
  artist: { artist_name: string },
): Promise<StoredAttachment> {
  const folderName = artist.artist_name
    .toLowerCase()
    .replace(/[^a-zA-Z0-9.-]/g, "-");
  const cleanFilename = attachment.filename
    .replace(/[^a-zA-Z0-9.-]/g, "-")
    .toLowerCase();
  const storagePath = `${folderName}/${cleanFilename}`;

  const response = await fetch(attachment.url);
  const blob = await response.blob();

  const { error: uploadError } = await supabaseAdmin.storage
    .from("attachments_artists")
    .upload(storagePath, blob, {
      contentType: attachment.type,
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage
    .from("attachments_artists")
    .getPublicUrl(storagePath);

  return {
    url: publicUrl,
    width: attachment.width,
    height: attachment.height,
    filename: attachment.filename,
    type: attachment.type,
  };
}

export async function syncArtistsToSupabase() {
  try {
    console.log("Starting artist sync process...");
    const table = getArtistsTable();

    // Get existing records from Supabase to compare timestamps
    const { data: existingArtists, error: fetchError } = await supabaseAdmin
      .from("artists")
      .select("id, updated_at")
      .eq("live_in_production", true);

    if (fetchError) throw fetchError;

    // Create a map of existing artists with their last update time
    const existingArtistsMap = new Map(
      existingArtists?.map((artist) => [
        artist.id,
        new Date(artist.updated_at),
      ]) || [],
    );

    // Get all records that are marked for production from Airtable
    const records = await table
      .select({
        filterByFormula: "{Add to Website} = 1",
      })
      .all();

    console.log(`Found ${records.length} artist records to process`);

    let processedCount = 0;
    const errors: SyncError[] = [];

    // Process each record
    for (const record of records) {
      try {
        const recordId = record.id;
        const lastModified = new Date(record.get("Last Modified") as string);

        // Skip if record exists and hasn't been modified since last sync
        const existingLastUpdate = existingArtistsMap.get(recordId);
        if (existingLastUpdate && lastModified <= existingLastUpdate) {
          console.log(`Skipping unchanged record: ${recordId}`);
          continue;
        }

        console.log(
          `Processing artist: ${recordId} - ${record.get("Artist Name")}`,
        );

        // Process photos
        const rawPhotos = record.get("Artist Photo");
        const artist_photo: StoredAttachment[] = [];

        if (Array.isArray(rawPhotos)) {
          for (const att of rawPhotos) {
            const attachment = await uploadArtistPhotoToSupabase(att, {
              artist_name: record.get("Artist Name") as string,
            });
            artist_photo.push(attachment);
          }
        }

        // Create artist object
        const artist: Artist = {
          id: record.id,
          artist_name:
            (record.get("Artist Name") as string) || "Unknown Artist",
          artist_bio: (record.get("Artist Bio") as string) || null,
          born: (record.get("Born") as string) || null,
          city: (record.get("City") as string) || null,
          state: (record.get("State (USA)") as string) || null,
          country: (record.get("Country") as string) || null,
          ig_handle: (record.get("IG Handle") as string) || null,
          website: (record.get("Website") as string) || null,
          live_in_production: true,
          artist_photo,
          created_at: new Date().toISOString(),
          updated_at: lastModified.toISOString(), // Use Airtable's last modified time
        };

        // Upsert to Supabase
        const { error: upsertError } = await supabaseAdmin
          .from("artists")
          .upsert(artist);

        if (upsertError) throw upsertError;

        processedCount++;
        console.log(`Successfully processed artist: ${artist.artist_name}`);
      } catch (error) {
        console.error(`Error processing artist ${record.id}:`, error);
        errors.push({
          record_id: record.id,
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
        });
      }
    }

    return {
      success: true,
      processedCount,
      total: records.length,
      errors: errors.length > 0 ? errors : null,
    };
  } catch (error) {
    console.error("Artist sync error:", error);
    throw error;
  }
}
