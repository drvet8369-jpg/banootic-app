-- ### POLICIES FOR STORAGE ###

-- 1. پاک کردن پالیسی‌های قدیمی (در صورت وجود)
DROP POLICY IF EXISTS "Allow public read access to images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload images" ON storage.objects;
DROP POLICY IF EXISTS "Allow user to update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Allow user to delete their own images" ON storage.objects;

-- 2. ایجاد پالیسی‌های جدید و کامل برای باکت "images"

-- پالیسی ۱: به همه اجازه می‌دهد تا عکس‌ها را مشاهده کنند.
CREATE POLICY "Allow public read access to images"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'images' );

-- پالیسی ۲: به کاربران لاگین‌کرده (authenticated) اجازه می‌دهد عکس جدید آپلود کنند.
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images' AND
  auth.role() = 'authenticated'
);

-- پالیسی ۳: به کاربر اجازه می‌دهد تا عکس‌های خودش را آپدیت کند.
-- (UID کاربر باید با owner عکس یکی باشد)
CREATE POLICY "Allow user to update their own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images' AND
  auth.uid() = owner
);

-- پالیسی ۴: به کاربر اجازه می‌دهد تا عکس‌های خودش را حذف کند.
-- (UID کاربر باید با owner عکس یکی باشد)
CREATE POLICY "Allow user to delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'images' AND
  auth.uid() = owner
);