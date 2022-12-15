const { sqrt, sin, cos, asin, acos, PI } = Math;
const TAU = PI*2;

const toDeg = (rad) => rad*(180/PI);
const rotateX = ([ x, y, z ], angle) => [ x, y*cos(angle) + z*sin(angle), z*cos(angle) - y*sin(angle) ];
const rotateY = ([ x, y, z ], angle) => [ x*cos(angle) - z*sin(angle), y, z*cos(angle) + x*sin(angle) ];
const rotateZ = ([ x, y, z ], angle) => [ x*cos(angle) + y*sin(angle), y*cos(angle) - x*sin(angle), z ];
const scale = ([ x, y, z ], scale) => [ x*scale, y*scale, z*scale ];
const add = ([ ax, ay, az ], [ bx, by, bz ]) => [ ax + bx, ay + by, az + bz ];

const getCoords = ([ x, y, z ]) => {
	const lat = asin(y/sqrt(x*x + y*y + z*z));
	const lon = acos(z/sqrt(z*z + x*x))*(x>=0?1:-1);
	return [ lat, lon ];
};

const getPosition = (lat, lon, radius, height) => {
	let pos = [ 0, 0, radius + height ];
	pos = rotateX(pos, lat);
	pos = rotateY(pos, -lon);
	return pos;
};

const getLocalSpeed = (lat, lon, azm, alt, magnitude) => {
	let dir = [ 0, 1, 0 ];
	dir = rotateX(dir, -alt);
	dir = rotateZ(dir, azm);
	dir = rotateX(dir, lat);
	dir = rotateY(dir, -lon);
	return scale(dir, magnitude);
};

const getTangentialSpeed = (lat, lon, radius, height, period) => {
	const circ = TAU*(radius + height)*cos(lat);
	const magnitude = circ/period;
	return rotateY([ magnitude, 0, 0 ], -lon);
};

const Simulation = ({
	lat,
	lon,
	height,
	azm,
	alt,
	speed,
	radius,
	rotationPeriod,
	deltaTime,
	gSurfaceAcc,
}) => {
	let [ px, py, pz ] = getPosition(lat, lon, radius, height);
	let [ vx, vy, vz ] = add(
		getLocalSpeed(lat, lon, azm, alt, speed),
		getTangentialSpeed(lat, lon, radius, height, rotationPeriod),
	);
	const G = gSurfaceAcc*radius*radius;
	return {
		px, py, pz,
		vx, vy, vz,
		dt: deltaTime,
		time: 0,
		radius,
		rotationPeriod,
		G,
		itCount: 0,
		impact: false,
		run: function(nIt) {
			let { px, py, pz, vx, vy, vz, radius, dt, time, G, itCount } = this;
			for (let i=0; i<nIt; ++i) {
				const t = px*px + py*py + pz*pz;
				const d = sqrt(t);
				if (d <= radius) break;
				const dir_x = -px/d;
				const dir_y = -py/d;
				const dir_z = -pz/d;
				const mag = G/t;
				vx += mag*dir_x*dt;
				vy += mag*dir_y*dt;
				vz += mag*dir_z*dt;
				px += vx*dt;
				py += vy*dt;
				pz += vz*dt;
				time += dt;
				++ itCount;
			}
			if (this.impact === false) {
				this.impact = sqrt(px*px + py*py + pz*pz) <= radius;
			}
			this.px = px;
			this.py = py;
			this.pz = pz;
			this.vx = vx;
			this.vy = vy;
			this.vz = vz;
			this.time = time;
			this.itCount = itCount;
			return this;
		},
		info: function() {
			const { px, py, pz, time, rotationPeriod, itCount } = this;
			let rotated = TAU*(time/rotationPeriod);
			let pos = rotateY([ px, py, pz ], rotated);
			let coord = getCoords(pos).map(toDeg);
			return { impact: this.impact, time: time, coord, iterations: itCount };
		}
	};
};

export default Simulation;
