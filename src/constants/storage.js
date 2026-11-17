/** Supabase Storage bucket names. Create both in the Supabase dashboard (see DEPLOY.md). */
export const PUBLIC_BUCKET = 'po-public' // store logos and product photos: public bucket
export const PRIVATE_BUCKET = 'po-private' // payment proofs: private bucket, reachable only through short-lived signed links
