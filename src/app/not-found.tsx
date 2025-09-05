import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SearchX } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 md:py-32">
      <SearchX className="w-24 h-24 text-destructive mb-6" />
      <h1 className="font-display text-5xl md:text-7xl font-bold">۴۰۴ - صفحه یافت نشد</h1>
      <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto">
        متاسفانه صفحه‌ای که به دنبال آن بودید وجود ندارد. ممکن است آدرس را اشتباه وارد کرده باشید یا صفحه حذف شده باشد.
      </p>
      <Button asChild size="lg" className="mt-8">
        <Link href="/">بازگشت به صفحه اصلی</Link>
      </Button>
    </div>
  )
}
