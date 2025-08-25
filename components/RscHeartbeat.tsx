export const dynamic = 'force-static';
export default async function RscHeartbeat() {
  // Returns the same markup on server and client
  return <div style={{display:"none"}} data-hb="ok" />;
}