import "server-only";
import { redirect } from "next/navigation";

export default function LegacyClientRedirect() {
  redirect("/creator");
}