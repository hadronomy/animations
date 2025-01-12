import { defineConfig } from 'vite';
import motionCanvas from '@motion-canvas/vite-plugin';
import ffmpeg from '@motion-canvas/ffmpeg';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [motionCanvas(), ffmpeg(), tsconfigPaths()],
});
