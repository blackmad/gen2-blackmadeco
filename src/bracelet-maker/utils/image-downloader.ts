export class ImageDownloaderImpl {
  lastUrl: string | null = null;
  lastBuffer: Buffer | null = null;

  async fetch(url: string): Promise<Buffer> {
    if (this.lastUrl === url && this.lastBuffer) {
      return this.lastBuffer;
    }

    const corsUrl = url.includes("http")
      ? "https://corsproxy.io/?" + encodeURIComponent(url)
      : url;
    const response = await fetch(corsUrl);
    this.lastBuffer = Buffer.from(await response.arrayBuffer());
    return this.lastBuffer;
  }
}

export const ImageDownloader = new ImageDownloaderImpl();
