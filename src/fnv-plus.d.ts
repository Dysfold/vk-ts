declare module 'fnv-plus' {
  export function fast1a32(str: string): number;
  export function fast1a32hex(str: string): string;
  export function fast1a52(str: string): number;
  export function fast1a52hex(str: string): string;
  export function fast1a64(str: string): string;
  export function fast1a32utf(str: string): number;
  export function fast1a32hexutf(str: string): string;
  export function fast1a52utf(str: string): number;
  export function fast1a52hexutf(str: string): string;
  export function fast1a64utf(str: string): string;
}
