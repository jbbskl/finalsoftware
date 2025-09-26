import "server-only";
import { redirect } from "next/navigation";

export default function LegacyClientBotsRedirect() { 
  redirect("/creator/bots"); 
}