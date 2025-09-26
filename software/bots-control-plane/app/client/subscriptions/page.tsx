import "server-only";
import { redirect } from "next/navigation";

export default function LegacyClientSubRedirect() { 
  redirect("/creator/subscriptions"); 
}