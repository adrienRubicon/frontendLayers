const apiUrl = 'https://a55kqhh6wf.execute-api.us-east-1.amazonaws.com/default';

var map = L.map('map').setView([48.436, 2.913], 4);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);

let rasterLayers = {};
let rasterColors = {}; // Store colors for each raster

function fetchRasters() {
    fetch(`${apiUrl}/rasterList`)
    .then(response => response.json())
    .then(rasterUrls => {
        const select = document.getElementById('raster-select');
        select.innerHTML = '';  // Clear any existing options
        var obj = JSON.parse(rasterUrls.body);
        const colorScale = chroma.scale('Set1').colors(Object.keys(obj).length);

        Object.entries(obj).forEach(([raster, url], index) => {
            const option = document.createElement('option');
            option.value = url;
            option.textContent = raster;
            option.style.color = colorScale[index]; // Assign a unique color to the option text
            rasterColors[raster] = colorScale[index]; // Store color for use in map layers
            select.appendChild(option);
        });
    });
}

function importRasters() {
    const selectedOptions = Array.from(document.getElementById('raster-select').selectedOptions);
    selectedOptions.forEach(option => {
        fetch(option.value)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => {
                parseGeoraster(arrayBuffer).then(georaster => {

                    const color = rasterColors[option.textContent]; // Retrieve stored color

                    const layer = new GeoRasterLayer({
                        georaster: georaster,
                        opacity: 0.7,
                        pixelValuesToColorFn: (pixelValues) => {
                            const value = pixelValues[0];
                            if (value === -9999) {
                                return 'rgba(0, 0, 0, 0)'; // Transparent for nodata values
                            } else {
                                return chroma(color).alpha(0.7).hex();
                            }
                        },
                        resolution: 256  // Adjust as necessary
                    }).addTo(map);

                    rasterLayers[option.value] = layer;
                });
            })
            .catch(console.error);
    });
}

fetchRasters();
