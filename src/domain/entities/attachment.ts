/**
 * Adjunto de un comentario (← `Desk.CasesCommentsAttach`).
 * La PK remota es compuesta: (`idCaseComment`, `idCase`), porque el Id del
 * comentario es secuencial POR CASO. Ver DATA_MODEL.md §2.
 */
export interface Attachment {
  serverId: number;
  commentServerId: number;
  caseServerId: number;
  /** Nombre del archivo tal como lo guarda el servidor. */
  fileName: string;
}

/** Archivo elegido en el dispositivo, listo para subir. */
export interface FileToUpload {
  uri: string;
  name: string;
  mimeType: string;
}
