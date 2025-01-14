import { defineConfig } from 'vite';
import motionCanvas from '@motion-canvas/vite-plugin';
import ffmpeg from '@motion-canvas/ffmpeg';
import tsconfigPaths from 'vite-tsconfig-paths';
import csv from '@rollup/plugin-dsv';

export default defineConfig({
  plugins: [motionCanvas(), ffmpeg(), tsconfigPaths(), csv()],
});
