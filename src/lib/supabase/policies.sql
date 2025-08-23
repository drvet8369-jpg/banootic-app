-- =================================================================
-- ===             جدول کاربران (Providers & Customers)         ===
-- =================================================================

-- 1. فعال کردن Row Level Security
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- 2. حذف پالیسی‌های قدیمی (برای جلوگیری از تداخل)
DROP POLICY IF EXISTS "Authenticated users can view providers" ON public.providers;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.providers;
DROP POLICY IF EXISTS "Authenticated users can view customers" ON public.customers;
DROP POLICY IF EXISTS "Users can create their own customer profile" ON public.customers;

-- 3. تعریف پالیسی‌های جدید
-- پالیسی برای Providers
CREATE POLICY "Authenticated users can view providers" ON public.providers FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.providers FOR UPDATE USING (auth.jwt() ->> 'phone' = phone) WITH CHECK (auth.jwt() ->> 'phone' = phone);

-- پالیسی برای Customers
CREATE POLICY "Authenticated users can view customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Users can create their own customer profile" ON public.customers FOR INSERT WITH CHECK (auth.jwt() ->> 'phone' = phone);


-- =================================================================
-- ===           فضای ذخیره‌سازی عکس‌ها (Storage - images)        ===
-- =================================================================

-- 1. فعال کردن RLS برای Storage
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. حذف پالیسی‌های قدیمی از روی storage.objects
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner to update" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner to delete" ON storage.objects;

-- 3. تعریف پالیسی‌های جدید و کامل برای storage.objects
--  این پالیسی به همه اجازه می‌دهد تا عکس‌های داخل پوشه images را ببینند
CREATE POLICY "Allow public read access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'images');

-- این پالیسی به هر کاربر لاگین شده‌ای اجازه می‌دهد عکس جدیدی آپلود کند
CREATE POLICY "Allow authenticated users to upload" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'images' AND
  auth.role() = 'authenticated'
);

-- این پالیسی فقط به صاحب عکس اجازه می‌دهد آن را آپدیت کند
CREATE POLICY "Allow owner to update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'images' AND
  auth.uid() = owner
);

-- این پالیسی فقط به صاحب عکس اجازه می‌دهد آن را حذف کند
CREATE POLICY "Allow owner to delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'images' AND
  auth.uid() = owner
);
