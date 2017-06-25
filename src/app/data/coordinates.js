
export default class Coordinates {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    copy() { return new Coordinates(this.getX(), this.getY()); }
    toString() { return 'x:' + this.getX() + ' y:' + this.getY();}
    same(coord) { return this.getX() === coord.getX() && this.getY() === coord.getY(); }

    add(coord) { this.addX(coord.getX()); this.addY(coord.getY()); return this; }
    getX() { return this.x; }
    getY() { return this.y; }
    addX(val) { this.x += val; return this; }
    addY(val) { this.y += val; return this; }
    setX(x) { this.x = x; return this; }
    setY(y) { this.y = y; return this; }
}
