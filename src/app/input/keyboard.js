
import Direction from 'app/data/direction';

export default class Keyboard {
    constructor(inputEngine) {
        let engine = this.engine = inputEngine;

        document.onkeydown = function (event) {
    		switch(event.which)
    		{
    			case 38:	// UP
    				engine.changeDirection(Direction.UP);
    				return false;
    			case 40:	// DOWN
    				engine.changeDirection(Direction.DOWN);
    				return false;
    			case 37:	// LEFT
    				engine.changeDirection(Direction.LEFT);
    				return false;
    			case 39:	// RIGHT
    				engine.changeDirection(Direction.RIGHT);
    				return false;
    			case 27:	// ESC
    				break;
    			case 13:	// Enter
    				break;
    			case 32:	// SPACE
    				//plantBomb();
    				break;
    			default:
    				break;
    		}
    	};

    	document.onkeyup = function (event) {

    		switch(event.which)
    		{
    			case 38:	// UP
    				engine.stopDirection(Direction.UP);
    				break;
    			case 40:	// DOWN
    				engine.stopDirection(Direction.DOWN);
    				break;
    			case 37:	// LEFT
    				engine.stopDirection(Direction.LEFT);
    				break;
    			case 39:	// RIGHT
    				engine.stopDirection(Direction.RIGHT);
    				break;
    			default:
    				break;
    		}

    		return false;
    	};
    }
}
