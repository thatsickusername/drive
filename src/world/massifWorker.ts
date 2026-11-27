import { buildMassifRawData, RawMassifData } from './massifBuilder';
import { generateSnowDetailData } from './shaders/detailTextureData';

export interface MassifWorkerRequest {
  detailSize: number;
  sunDir: { x: number; y: number; z: number };
}

export interface MassifWorkerResponse {
  detailSize: number;
  detailData: Uint8Array<ArrayBuffer>;
  massif: RawMassifData;
}

self.onmessage = (event: MessageEvent<MassifWorkerRequest>) => {
  const { detailSize, sunDir } = event.data;
  const transferables: Transferable[] = [];

  const detailData = generateSnowDetailData(detailSize);
  transferables.push(detailData.buffer);

  const massif = buildMassifRawData(sunDir, transferables);

  const response: MassifWorkerResponse = {
    detailSize,
    detailData,
    massif
  };
  (self as unknown as Worker).postMessage(response, transferables);
};
