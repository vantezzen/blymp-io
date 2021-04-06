declare interface Window {
  sa_event: (name : String) => void
}
declare interface File {
  webkitSlice: (start?: number | undefined, end?: number | undefined) => Blob
}

declare module "*.svg" {
  const content: any;
  export default content;
}
declare module "*.png" {
  const content: any;
  export default content;
}

declare module 'react-ionicons/lib/*';

declare module 'react-faq-component';