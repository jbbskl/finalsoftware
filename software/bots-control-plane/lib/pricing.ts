import { PlatformKey } from "@/lib/types"

/** CREATOR: 1 model always; price by automations selected */
export function creatorMonthlyTotal(selectedAutomations: Array<{ platform: PlatformKey; key: string }>) {
  const unit = 40 // €40 per automation per platform
  return selectedAutomations.length * unit
}

/** AGENCY: unit price by model count; price by unique platforms × models */
export function agencyUnitPrice(models: number): number | "contact_sales" {
  if (models >= 100) return 50    // contact sales flow in UI
  if (models >= 50)  return 60    // contact sales flow as well
  return 65
}

export function agencyMonthlyTotal(models: number, selectedAutomations: Array<{ platform: PlatformKey }>) {
  const unit = agencyUnitPrice(models)
  if (unit === "contact_sales") return "contact_sales"
  const uniquePlatforms = new Set(selectedAutomations.map(a => a.platform)).size
  return models * uniquePlatforms * unit
}

// Helper function to get available automations for creators
export function getCreatorAutomations() {
  return [
    { platform: "onlyfans" as PlatformKey, key: "onlyfans_posting", name: "OnlyFans Posting", description: "Automated posting to OnlyFans" },
    { platform: "onlyfans" as PlatformKey, key: "onlyfans_mass_dm", name: "OnlyFans Mass DM", description: "Automated mass messaging on OnlyFans" },
    { platform: "fanvue" as PlatformKey, key: "fanvue_posting", name: "Fanvue Posting", description: "Automated posting to Fanvue" },
    { platform: "fanvue" as PlatformKey, key: "fanvue_mass_dm", name: "Fanvue Mass DM", description: "Automated mass messaging on Fanvue" },
    { platform: "f2f" as PlatformKey, key: "f2f_posting", name: "F2F Posting", description: "Automated posting to F2F" },
    { platform: "f2f" as PlatformKey, key: "f2f_mass_dm", name: "F2F Mass DM", description: "Automated mass messaging on F2F" },
  ]
}