export default function Footer() {
  return (
    <footer className="w-full border-t bg-background">
      <div className="container py-6 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} دستبانو. تمام حقوق محفوظ است.</p>
        <p className="mt-1">توانمندسازی بانوان، اتصال جوامع.</p>
      </div>
    </footer>
  );
}
