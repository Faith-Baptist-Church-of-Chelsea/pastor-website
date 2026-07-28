import KeystaticApp from "../keystatic";

// The /keystatic admin panel. It renders entirely on the client;
// it sits outside the (site) group so the CMS gets the full screen.
export default function Page() {
  return <KeystaticApp />;
}
