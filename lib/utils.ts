import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function quickSort(arr: string[]): string[] {
  if (arr.length <= 1) {
    return arr;
  }
  const pivotIndex = Math.floor(arr.length / 2);
  const pivotValue = arr[pivotIndex];
  const leftArr = [];
  const rightArr = [];
  for (let i = 0; i < arr.length; i++) {
    if (i === pivotIndex) continue;
    if (arr[i] <= pivotValue) {
      leftArr.push(arr[i]);
    } else {
      rightArr.push(arr[i]);
    }
  }
  return [...quickSort(leftArr), pivotValue, ...quickSort(rightArr)];
}

export function capitalize(str: string) {
  // First, handle cases where a lowercase letter is followed by a capital letter
  // This splits "magnesiumLThreonate" into "magnesium LThreonate"
  let result = str.replace(/([a-z])([A-Z])/g, '$1 $2');
  
  // Then, handle cases where a capital letter is followed by more capital letters
  // This splits "LThreonate" into "L Threonate"
  result = result.replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
  
  // Finally, capitalize the first letter of each word
  return result.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

export function spellOutDate(dateStr: string): string {
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6)) - 1; // Convert to 0-based month
  const day = parseInt(dateStr.substring(6, 8));
  const date = new Date(year, month, day, 12, 0, 0); // Set to noon to avoid timezone issues
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = monthNames[date.getMonth()];
  return `${monthName}${monthName !== "May" ? "." : ""} ${day}, ${year}`;
}

export function toCamelCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((word, index) => 
      index === 0 
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join('');
}

export function fromAllCaps(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
}

export function roundToNearestWhole(num: number | string) {
  if (typeof num === 'string') {
    num = parseFloat(num);
  }
  return Math.round(num);
}

export function roundToNearestTenth(num: number | string) {
  if (typeof num === 'string') {
    num = parseFloat(num);
  }
  return Math.round(num * 10) / 10;
}

export function generateApexionID() {
  return crypto.randomUUID();
}