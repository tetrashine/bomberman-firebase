
export default class Coordinates {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(coord) { this.addX(coord.getX()); this.addY(coord.getY()); }
    getX() { return this.x; }
    getY() { return this.y; }
    addX(val) { this.x += val; }
    addY(val) { this.y += val; }
    copy() { return new Coordinates(this.getX(), this.getY()); }
    toString() { return 'x:' + this.getX() + ' y:' + this.getY();}
    same(coord) { return this.getX() === coord.getX() && this.getY() === coord.getY(); }

    setX(x) { this.x = x; }
    setY(y) { this.y = y; }
}
