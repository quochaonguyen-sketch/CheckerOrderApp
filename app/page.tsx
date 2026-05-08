import { LoginGate } from "@/components/LoginGate";
import { ScannerApp } from "@/components/ScannerApp";

export default function HomePage() {
  return (
    <LoginGate>
      <ScannerApp />
    </LoginGate>
  );
}
