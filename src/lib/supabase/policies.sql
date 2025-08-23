-- =================================================================
-- === STORAGE POLICIES (برای سطل 'images') ===
-- =================================================================
-- این پالیسی‌ها مشخص می‌کنند چه کسی اجازه آپلود، مشاهده، ویرایش و حذف فایل‌ها را دارد.

-- 1. پاک کردن پالیسی‌های قدیمی برای جلوگیری از تداخل
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner to update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner to delete their own files" ON storage.objects;

-- 2. تعریف پالیسی برای مشاهده عمومی فایل‌ها (Public Read Access)
-- هر کسی (چه لاگین کرده باشد و چه نکرده باشد) می‌تواند عکس‌ها را ببیند.
CREATE POLICY "Allow public read access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'images');

-- 3. تعریف پالیسی برای آپلود فایل توسط کاربران لاگین کرده
-- فقط کاربرانی که لاگین کرده‌اند (authenticated) می‌توانند فایل جدیدی آپلود کنند.
CREATE POLICY "Allow authenticated users to upload" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'images');

-- 4. تعریف پالیسی برای آپدیت فایل توسط صاحب آن
-- یک کاربر فقط زمانی می‌تواند یک فایل را آپدیت کند که صاحب آن فایل باشد.
-- (owner) همان user_id کاربر لاگین کرده است.
CREATE POLICY "Allow owner to update their own files" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (auth.uid() = owner) 
WITH CHECK (bucket_id = 'images');

-- 5. تعریف پالیسی برای حذف فایل توسط صاحب آن
-- یک کاربر فقط زمانی می‌تواند یک فایل را حذف کند که صاحب آن فایل باشد.
CREATE POLICY "Allow owner to delete their own files" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (auth.uid() = owner);
