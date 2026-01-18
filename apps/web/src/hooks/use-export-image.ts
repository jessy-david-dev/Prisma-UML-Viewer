'use client';

import { useCallback } from 'react';
import { toPng, toSvg, toJpeg } from 'html-to-image';

export type ImageFormat = 'png' | 'svg' | 'jpeg';

interface ExportImageOptions {
  format: ImageFormat;
  quality?: number;
  backgroundColor?: string;
  filename?: string;
  includeGrid?: boolean;
}

function drawGridBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  gridSize: number = 50,
  backgroundColor: string = '#18181b',
  gridColor: string = '#3f3f46'
) {
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;

  for (let x = 0; x <= width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = 0; y <= height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

export function useExportImage() {
  const downloadImage = useCallback(async (options: ExportImageOptions) => {
    const {
      format,
      quality = 0.92,
      backgroundColor = '#18181b',
      filename = 'prisma-schema',
      includeGrid = true,
    } = options;

    const reactFlowContainer = document.querySelector('.react-flow') as HTMLElement;
    if (!reactFlowContainer) {
      console.error('React Flow container not found');
      return false;
    }

    const nodeElements = document.querySelectorAll('.react-flow__node') as NodeListOf<HTMLElement>;
    if (nodeElements.length === 0) {
      console.error('No nodes to export');
      return false;
    }

    const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!viewport) {
      console.error('React Flow viewport not found');
      return false;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodeElements.forEach((nodeEl) => {
      const transform = nodeEl.style.transform;
      const match = transform.match(/translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/);

      if (match) {
        const x = parseFloat(match[1]);
        const y = parseFloat(match[2]);
        const width = nodeEl.offsetWidth;
        const height = nodeEl.offsetHeight;

        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + width);
        maxY = Math.max(maxY, y + height);
      }
    });

    if (minX === Infinity) {
      console.error('Could not calculate node bounds');
      return false;
    }

    const padding = 80;
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const imageWidth = Math.ceil(contentWidth + padding * 2);
    const imageHeight = Math.ceil(contentHeight + padding * 2);

    const originalTransform = viewport.style.transform;

    viewport.style.transform = `translate(${-minX + padding}px, ${-minY + padding}px) scale(1)`;

    await new Promise((resolve) => setTimeout(resolve, 30));

    const imageOptions = {
      backgroundColor: includeGrid ? 'transparent' : backgroundColor,
      width: imageWidth,
      height: imageHeight,
      quality,
      pixelRatio: 2,
      skipFonts: true,
      cacheBust: true,
      filter: (node: Element) => {
        const classList = (node as HTMLElement).classList;
        if (!classList) return true;

        if (
          classList.contains('react-flow__controls') ||
          classList.contains('react-flow__minimap') ||
          classList.contains('react-flow__panel') ||
          classList.contains('react-flow__background')
        ) {
          return false;
        }
        return true;
      },
    };

    try {
      const diagramDataUrl = await toPng(reactFlowContainer, imageOptions);

      viewport.style.transform = originalTransform;

      if (includeGrid && format !== 'svg') {
        const finalCanvas = document.createElement('canvas');
        const pixelRatio = 2;
        finalCanvas.width = imageWidth * pixelRatio;
        finalCanvas.height = imageHeight * pixelRatio;
        const ctx = finalCanvas.getContext('2d')!;

        ctx.scale(pixelRatio, pixelRatio);

        drawGridBackground(ctx, imageWidth, imageHeight, 50, backgroundColor, '#3f3f46');

        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = diagramDataUrl;
        });

        ctx.drawImage(img, 0, 0, imageWidth, imageHeight);

        let finalDataUrl: string;
        if (format === 'jpeg') {
          finalDataUrl = finalCanvas.toDataURL('image/jpeg', quality);
        } else {
          finalDataUrl = finalCanvas.toDataURL('image/png');
        }

        const link = document.createElement('a');
        link.download = `${filename}.${format}`;
        link.href = finalDataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        let dataUrl: string;

        if (format === 'svg') {
          viewport.style.transform = `translate(${-minX + padding}px, ${-minY + padding}px) scale(1)`;
          await new Promise((resolve) => setTimeout(resolve, 30));
          dataUrl = await toSvg(reactFlowContainer, { ...imageOptions, backgroundColor });
          viewport.style.transform = originalTransform;
        } else {
          dataUrl = diagramDataUrl;
        }

        const link = document.createElement('a');
        link.download = `${filename}.${format}`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      return true;
    } catch (error) {
      console.error('Failed to export image:', error);
      viewport.style.transform = originalTransform;
      return false;
    }
  }, []);

  return { downloadImage };
}
