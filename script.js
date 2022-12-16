import Simulation from "./simulation.js";

const inputs = [...document.querySelectorAll('[type="text"]')];
const runButton = document.querySelector('[type="button"]');
const info = document.querySelector('.fields textarea');
const logs = document.querySelector('.logs textarea');
const freeThread = () => new Promise(done => setTimeout(done, 0));

const distUnits = {
	'mm': 0.001,
	'cm': 0.01,
	'km': 1000,
	'in': 0.0254,
	'ft': 0.3048,
	'mi': 1609.344,
	'm':  1,
};

const speedUnits = {
	'km/h': 1000/3600,
	'kmph': 1000/3600,
	'mph': 1609.344/3600,
	'mps': 1,
	'm/s': 1,
	'kph': 1000/3600,
};

const parseAngle = (str) => Number(str)/180*Math.PI;
const splitValueUnit = (str) => [...str.trim().match(/^(.*?)\s*([a-z\/]+)?$/)].slice(1);
const parseDist = (str) => {
	const [ val, unit ] = splitValueUnit(str.toLowerCase());
	if (!unit) return Number(val);
	return val*distUnits[unit];
};
const parseSpeed = (str) => {
	const [ val, unit ] = splitValueUnit(str.toLowerCase());
	if (!unit) return Number(val);
	return val*speedUnits[unit];
};

window.parseDist = parseDist;
window.parseSpeed = parseSpeed;

const parseMap = {
	lat: parseAngle,
	lon: parseAngle,
	height: parseDist,
	azm: parseAngle,
	alt: parseAngle,
	speed: parseSpeed,
	radius: parseDist,
};

let simId = 0;
runButton.addEventListener('click', async () => {
	const args = {};
	inputs.forEach(input => {
		const name = input.getAttribute('name');
		const value = parseMap[name]?.(input.value) ?? Number(input.value);
		args[name] = value;
	});
	const sim = Simulation(args);
	const id = ++simId;
	while (!sim.impact) {
		sim.run(5000);
		info.value = JSON.stringify(sim.info(), null, '  ');
		logs.value = 'time,x,y,z,height\n' + sim.logs.join('\n');
		await freeThread();
		if (id !== simId) break;
	}
});
