# Clipped Regions Map Generator

This utility creates a single large image containing all regions from the map, each clipped to its region boundary shape and filled with either the corresponding image or a color based on the region's properties.

## What it does

1. Loads all region GeoJSON files from `public/regions/` folder
2. For each region, looks for a matching image in `public/images_optimized/` with the same name as the region's label property
3. Converts WebP images to PNG format for compatibility with the canvas library
4. If an image exists, it clips the image to the region's polygon boundaries and places it in the correct position on the output image
5. If no image exists, it fills the region with a color based on its `fill` property
6. Draws region boundaries for visual clarity
7. Outputs a single large PNG image in the `public/` folder
8. Cleans up temporary converted image files

## Usage

First, install the dependencies:

```
npm install
```

Then run the utility:

```
npm run create-clipped-map
```

The output will be saved as `public/clipped_regions_map.png`

## Configuration

You can adjust the following parameters at the top of the script:

- `PADDING`: Padding around the edges of the final image
- `SCALE_FACTOR`: Scale factor to convert map coordinates to pixels
- `OUTPUT_FILENAME`: Name of the output file
- `DRAW_BORDERS`: Whether to draw region borders
- `BORDER_COLOR`: Color of region borders
- `BORDER_WIDTH`: Width of region borders
- `BACKGROUND_COLOR`: Background color of the image
- `COLOR_MAP`: Mapping of region fill colors to display colors
- `TMP_DIR`: Directory for temporary converted image files
- `BATCH_SIZE`: Number of images to process before reporting progress

## Features and Technical Notes

### WebP Conversion
The tool uses Sharp library to convert WebP images to PNG format before processing. This is necessary because the Node.js Canvas library doesn't natively support WebP images. The conversion process temporarily creates PNG files in the `public/tmp_converted_images` directory, which are automatically cleaned up after the map generation is complete.

### Coordinate System Handling
The script properly handles the Y-axis flip between GeoJSON coordinates (where latitude increases upward) and canvas coordinates (where Y increases downward). This ensures that the regions are not vertically flipped in the output image.

### Performance Optimizations
- **Image Caching**: The tool caches loaded images in memory to avoid re-loading the same images multiple times
- **Parallel Processing**: Images are processed in batches for improved performance
- **Progress Reporting**: Shows progress percentage during processing to track completion
- **Smart Conversion**: Only converts WebP images to PNG when needed and reuses existing converted files

### Disk Space Requirements
If you're processing a large number of images, make sure you have sufficient disk space for the temporary PNG files. The tool processes images on-demand and cleans them up afterwards to minimize disk usage.

## Use with Tippecanoe

The generated image can be used with tools like Tippecanoe to create raster tile layers:

```bash
tippecanoe -o output.mbtiles -z 12 --full-detail=12 clipped_regions_map.png
```

This will create an MBTiles file that can be served as a background tile layer for your map.
