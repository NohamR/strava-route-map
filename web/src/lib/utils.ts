import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type UnitSystem = 'metric' | 'imperial'

const UNITS_KEY = 'strava_units'

export function getStoredUnits(): UnitSystem {
  return (localStorage.getItem(UNITS_KEY) as UnitSystem) || 'metric'
}

export function storeUnits(units: UnitSystem) {
  localStorage.setItem(UNITS_KEY, units)
}

export function kmToMi(km: number): string {
  return (km * 0.621371).toFixed(1)
}

export function mToFt(m: number): string {
  return Math.round(m * 3.28084).toString()
}
