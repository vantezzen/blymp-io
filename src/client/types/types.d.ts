declare interface Window {
  dataLayer?: Array<any>
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