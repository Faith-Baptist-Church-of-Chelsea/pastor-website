import KeystaticApp from "../keystatic";
import AreaSwitcher from "@/components/admin/AreaSwitcher";

// The /keystatic site editor. It renders entirely on the client and sits
// outside the (site) group so it gets the full screen. The switcher floats
// over it so getting back to the devotion queue is one tap.
export default function Page() {
  return (
    <>
      <KeystaticApp />
      <AreaSwitcher floating />
    </>
  );
}
