// TODO: Style

class MinimapConfigurator {
    constructor() {
        this.minimapFilepath = "./minimap.svg";

        this.commandTemplateID = "command-template";
        this.minimapObjectID = "minimap-svg";
        this.commandBox = "command-box";
        this.outputWindow = "config-window";

        this.minimapConfig = {
            // Main commands
            // -Template:
            //console_command: {
            //     localized_name: "",
            //     group_id: "",
            //     svg_size: .0,
            //     value: .0,
            //     min_value: .0,
            //     max_value: .0,
            // },
            citadel_minimap_zip_line_thickness: {
                localized_name: "Zipline thickness",
                group_id: "transit_lines",
                svg_size: .0,
                value: 1.0,
                min_value: 1.0,
                max_value: 15.0,
            },
            citadel_minimap_local_player_width: {
                localized_name: "Size of player icon",
                group_id: "player_icon",
                svg_size: .0,
                value: 4.0,
                min_value: 1.0,
                max_value: 10.0
            },
            citadel_minimap_player_width: {
                localized_name: "Size of other players icons",
                group_id: "hero_icons",
                svg_size: 17.5,
                value: 6.0,
                min_value: 1.0,
                max_value: 10.0,
            },
            citadel_minimap_max_icon_shrink: {
                localized_name: "Max icons shrinking",
                group_id: "icon_shrink",
                svg_size: .0,
                value: 1.0,
                min_value: 0.1,
                max_value: 1.0,
            }
        };
    };

    loadMinimap() {
        // SVG load
        fetch(this.minimapFilepath)
            .then(response => response.text())
            .then(data => document.getElementById(this.minimapObjectID).innerHTML = data);
        // Generating slider for every command in this.minimapConfig
        const sliderBox = document.getElementById(this.commandBox);
        const sliderTemplate = document.getElementById(this.commandTemplateID);
        Object.keys(this.minimapConfig).forEach((command) => {
            let data = this.minimapConfig[command];
            let clone = sliderTemplate.content.cloneNode(true);
            let slider = clone.getElementById("slider");
            let input = clone.getElementById("input");
            slider.min = data.min_value;
            input.min = data.min_value;
            slider.max = data.max_value;
            input.max = data.max_value;
            slider.value = data.value;
            input.value = data.value;
            clone.getElementById("command-name").textContent = data.localized_name;
            clone.getElementById("command-command").textContent = command;
            slider.addEventListener('input', () => {
                input.value = slider.value;
                this.updateValue(command, slider.value)
            });
            input.addEventListener('input', () => {
                slider.value = input.value;
                this.updateValue(command, input.value)
            });
            sliderBox.appendChild(clone);
        });
    };

    updateValue(command, value) {
        console.log(`${command} - ${value}`);
        this.minimapConfig[command].value = value;
        this.modifySvg(command);
        this.generateConfig();
    };

    generateConfig() {
        let cfgLine = "";
        Object.keys(this.minimapConfig).forEach((command) => {
            let data = this.minimapConfig[command];
            cfgLine += `${command} ${data.value}; `;
        });
        document.getElementById(this.outputWindow).textContent = cfgLine;
    };

    // I couldn't come up with the proper solution, but i think that one is kinda simple and
    // easy to edit in the future.
    modifySvg(command) {
        console.log(`Modifying group: ${this.minimapConfig[command].group_id}`);
        let group = document.getElementById(this.minimapConfig[command].group_id);
        let value = this.minimapConfig[command].value;
        switch(command) {
            case "citadel_minimap_zip_line_thickness":
                for (let object of group.children) object.style.strokeWidth = value;
                break;
            case "citadel_minimap_local_player_width":
                // The thing is I can't get proper scale with just inkscape_size * scale, so I just tone down this graph a bit
                // And add 1 to the scale so its not a small point possible. Just check values in the actual game.
                // And, as expected, all sizes are a bit off. Too lazy to find proper values.
                // Still, it gives you an idea how minimap will look like in the game.
                const bbox = group.getBBox();
                const cx = bbox.x + bbox.width / 2;
                const cy = bbox.y + bbox.height / 2;
                group.setAttribute('transform', `translate(${cx}, ${cy}) scale(${value / 1.4 + 1}) translate(${-cx}, ${-cy})`);
                break;
            case "citadel_minimap_player_width":
                // Also player icon gets stuck in exact same coords no matter what I do. Too bad!
                let scale = this.minimapConfig["citadel_minimap_player_width"].svg_size * value / 10;
                for (let object of group.children) object.setAttribute("r", scale);
                this.modifySvg("citadel_minimap_max_icon_shrink");
                break;
            case "citadel_minimap_max_icon_shrink":
                let widthData = this.minimapConfig["citadel_minimap_player_width"];
                let shrinkScale = widthData.svg_size * widthData.value / 10 * value;
                for (let object of group.children) object.setAttribute("r", shrinkScale);
                break;
        }
    };
};

const minimap_configurator = new MinimapConfigurator();
minimap_configurator.loadMinimap();

// This abomination updates values when svg loads.
const waitForSVG = async () => {
    while (!document.querySelector('svg')) {
      await new Promise(resolve => requestAnimationFrame(resolve));
    }
    Object.keys(minimap_configurator.minimapConfig).forEach((command) => {
        minimap_configurator.updateValue(command, minimap_configurator.minimapConfig[command].value);
    });
  };
  
waitForSVG();