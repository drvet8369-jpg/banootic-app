export default function Footer() {
  return (
    <footer className="w-full border-t bg-background">
      <div className="container py-6 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} ZanMahal. All rights reserved.</p>
        <p className="mt-1">Empowering Women, Connecting Communities.</p>
      </div>
    </footer>
  );
}
