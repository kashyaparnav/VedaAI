export interface FileUploadProps { label: string; file: File | null; onFile: (file: File) => void; }
export const cn = (...classes: (string | undefined | false)[]) => classes.filter(Boolean).join(" ");
