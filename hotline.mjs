/** @module hotline */

"use strict";

/**
 * @name hotline.mjs
 *
 * @description
 * Module for creating "hot lines"
 *
 * @class
 * @public
 *
 * @example
 * сonst instance = new hotline(shell);
 * instance.step = '-5';
 * instance.start();
 *
 * {@link https://git.mirzaev.sexy/mirzaev/hotline.mjs}
 *
 * @license http://www.wtfpl.net/ Do What The Fuck You Want To Public License
 * @author Arsen Mirzaev Tatyano-Muradovich <arsen@mirzaev.sexy>
 */
export class hotline {
	/**
	 * @name Shell
	 *
	 * @description
	 * Shell of elements that will be moving
	 *
	 * @type {HTMLElement}
	 *
	 * @protected
	 */
	#shell;

	/**
	 * @name First
	 *
	 * @description
	 * The first element of `this.#shell`
	 * Will be reinitialized on transfer operation ("transfer.beginning", "transfer.end")
	 *
	 * @type {object}
	 * @property {HTMLElement} element
	 * @property {DOMRect} rectangle Result of `getBoundingClientRect()`
	 * @property {number} position Margin (px) from the left or the top (movement)
	 * @property {number} offset Margin (px) from the right or the bottom (gap betweem elements)
	 * @property {number} end Coordinate of the element end (rectangle[(x|y)] + rectangle[(width|height)] + offset)
	 *
	 * @protected
	 */
	#first = {};

	/**
	 * @name Last
	 *
	 * @description
	 * The last element of `this.#shell`
	 * Will be reinitialized on transfer operation ("transfer.beginning", "transfer.end")
	 *
	 * @type {object}
	 * @property {HTMLElement} element
	 * @property {DOMRect} rectangle Result of `getBoundingClientRect()`
	 * @property {number} position Margin (px) from the left or the top (movement)
	 * @property {number} offset Margin (px) from the right or the bottom (gap betweem elements)
	 * @property {number} end Coordinate of the element end (rectangle[(x|y)] + rectangle[(width|height)] + offset)
	 *
	 * @protected
	 */
	#last = {};

	/**
	 * @name Status
	 *
	 * @description
	 * Indicator of the current state of the hotline instance.
	 * Can contain values: "ready", "started", "stopped".
	 *
	 * @type {(string[]|null)}
	 *
	 * @protected
	 */
	#status = null;

	/**
	 * @name Process
	 *
	 * @description
	 * Process of moving elements and handling events.
	 *
	 * Contains identifier from setInterval().
	 *
	 * @type {(number|null)}
	 *
	 * @protected
	 */
	#process = null;

	/**
	 * @name Interval
	 *
	 * @description
	 * Time period between executions of `this.#process` in setInterval().
	 *
	 * This greatly affects the experience. Try setting the value to 5, then 0, and then 20.
	 * I recommend not to ignore this property and change it depending on the type of use.
	 *
	 * `this.interval = 10` with `this.step = 1` is equal to `this.interval = 5` with `this.step = 2`
	 * But the difference in performance between them is two times!
	 *
	 * @type {number}
	 *
	 * @public
	 */
	interval = 10;

	/**
	 * @name Alive
	 *
	 * @description
	 * Will elements move by themselves?
	 *
	 * @type {boolean}
	 *
	 * @public
	 */
	alive = true;

	/**
	 * @name Freezed
	 *
	 * @description
	 * Freezed movement of elements by themselves?
	 *
	 * This property is used by the system to block the movement of elements at runtime.
	 * For example, when hovering the mouse cursor.
	 *
	 * @type {boolean}
	 *
	 * @protected
	 */
	#freezed = false;

	/**
	 * @name Moving
	 *
	 * @description
	 * Is the hotline instance currently moving by the user?
	 *
	 * Contain true while handling "onmousemove" or "ontouchmove" events
	 *
	 * @type {boolean}
	 *
	 * @protected
	 */
	#moving = "false";

	/**
	 * @name Moving (get)
	 *
	 * @description
	 * Getter for `this.#moving`
	 *
	 * @return {boolean}
	 *
	 * @public
	 */
	get moving() {
		return this.#moving;
	}

	/**
	 * @name Movable
	 *
	 * @description
	 * Can the user move elements by mouse and touches?
	 *
	 * @type {boolean}
	 *
	 * @public
	 */
	movable = true;

	/**
	 * @name Wheel
	 *
	 * @description
	 * Can the user move elements by mouse wheel?
	 *
	 * @type {boolean}
	 * @public
	 */
	wheel = false;

	/**
	 * @name Delta
	 *
	 * @description
	 * Delta offset of the position when processing the "wheel" event.
	 *
	 * If the value is null, "event.wheelDelta" will be used.
	 * If the value is zero, then you are an insane maniac.
	 *
	 * {@link https://git.mirzaev.sexy/mirzaev/hotline.mjs/issues/5}
	 *
	 * @type {(number|null)}
	 *
	 * @public
	 */
	delta = 30;

	/**
	 * @name Button
	 *
	 * @description
	 * Identifier of the mouse button that will perform the movement.
	 *
	 * 0: Main button pressed, usually the left button or the un-initialized state
	 * 1: Auxiliary button pressed, usually the wheel button or the middle button (if present)
	 * 2: Secondary button pressed, usually the right button
	 * 3: Fourth button, typically the Browser Back button
	 * 4: Fifth button, typically the Browser Forward button
	 *
	 * {@link https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button}
	 *
	 * @type {number}
	 *
	 * @public
	 */
	button = 0;

	/**
	 * @name Hover
	 *
	 * @description
	 * Freeze movement on mouse hover?
	 *
	 * @type {boolean}
	 *
	 * @public
	 */
	hover = true;

	/**
	 * @name Step
	 *
	 * @description
	 * Direction and speed of movement.
	 * To move in the opposite direction, invert the number.
	 *
	 * It should be configured at the same time as `this.interval`!
	 *
	 * Setting `this.interval = 10` with `this.step = 1` is equal to `this.interval = 5` with `this.step = 2`.
	 * But the difference in performance between them is two times!
	 *
	 * Setting the value to `float` will result in "lagging" at a slow speed.
	 *
	 * @type {number}
	 *
	 * @public
	 */
	step = 1;

	/**
	 * @name Transfer
	 *
	 * @description
	 * Allowed to transfer elements from one end to another?
	 *
	 * @type {boolean}
	 *
	 * @public
	 */
	transfer = true;

	/**
	 * @name Transfer
	 *
	 * @description
	 * Allowed to transfer elements from one end to another?
	 *
	 * Blocks transfer even if `this.transfer === true`
	 *
	 * This is a system constant that is not overwritten in the code.
	 *
	 * @type {boolean}
	 *
	 * @protected
	 */
	#transfer = true;

	/**
	 * @name Sticky
	 *
	 * @description
	 * Do not remove `mousemove` event listener when mouse moves out from `this.#shell`?
	 *
	 * Used to fix a bug where if you click on an element ("mousedown")
	 * and move the cursor outside `this.#shell` element, the functions
	 * for moving elements will not be removed from the "mousemove" listener.
	 * Clicking again to dispatch "mouseup" event does not work.
	 *
	 * Another fix is `this.#shell.addEventListener("mouseleave", leaved)`.
	 * But `sticky === true` is still very problematic.
	 *
	 * {@link https://git.mirzaev.sexy/mirzaev/hotline.mjs/issues/7}
	 *
	 * @type {boolean}
	 *
	 * @public
	 */
	sticky = false;

	/**
	 * @name Magnetism
	 *
	 * @description
	 * Types of areas in which the target element will be magnetized
	 *
	 * @type {object}
	 *
	 * @typedef magnetism
	 * @param {symbol} beginning
	 * @param {symbol} center
	 * @param {symbol} end
	 *
	 * @protected
	 */
	#magnetism = Object.freeze({
		beginning: Symbol("beginning"),
		center: Symbol("center"),
		end: Symbol("end")
	});

	/**
	 * @name Magnetism (get)
	 *
	 * @description
	 * Getter for `this.#magnetism`
	 *
	 * @return {magnetism}
	 *
	 * @public
	 */
	get magnetism() {
		return this.#magnetism;
	}

	/**
	 * @name Magnetic
	 *
	 * @description
	 * The area in which the target element will be magnetized
	 *
	 * @type {(magnetism.<symbol>|null)}
	 *
	 * @public
	 */
	magnetic = null;

	/**
	 * @name Magnet
	 *
	 * @description
	 * The power of magnetism (otherwise `this.step` will be used)
	 *
	 * Unlike `this.step`, this value must be a positive integer (natural), that is, it does not affect the direction
	 *
	 * @type {number}
	 *
	 * @public
	 */
	magnet = 1;

	/**
	 * @name Vertical
	 *
	 * @description
	 * The hotline instance moves vertically?
	 *
	 * @type {boolean}
	 *
	 * @public
	 */
	vertical = false;

	/**
	 * @name Observe
	 *
	 * @description
	 * Create an observer to change public properties when "data-hotline-*" attributes change?
	 *
	 * @type {boolean}
	 *
	 * @public
	 */
	observe = false;

	/**
	 * @name Observer
	 *
	 * @description
	 * Contains an observer instance that allows editing the properties of the hotline instance.
	 * by changing the value of `this.#shell` attributes.
	 *
	 * Works only when `this.observe === true`.
	 *
	 * @type {(MutationObserver|null)}
	 *
	 * @protected
	 */
	#observer = null;

	/**
	 * @name Events
	 *
	 * @description
	 * Registry of events that will be dispatched
	 *
	 * Events "transfer.beginning" and "transfer.end" used for elements transfers!
	 * Set `false` only when `this.movable === false`, otherwise there will be errors when calculating coordinates!
	 *
	 * Events dispatch by the shell element (`this.#shell`)
	 * Events have the form: "hotline.*" ("hotline.moved.forward", "hotline.stopped")
	 *
	 * @type {Map}
	 *
	 * @public
	 */
	events = new Map([
		["ready", false],
		["started", false],
		["stopped", false],
		["configured", false],
		["move", false],
		["move.mouse", false],
		["move.touch", false],
		["move.freezed", false],
		["move.unfreezed", false],
		["moved.forward", false],
		["moved.backward", false],
		["offset", false],
		["transfer.beginning", true],
		["transfer.end", true],
		["observer.started", false],
		["observer.stopped", false]
	]);

	/**
	 * @name Ignored
	 *
	 * @description
	 * Registry of properties (by "data-hotline-*" attributes)
	 * that will be ignored by the preprocessor
	 *
	 * @type {Set}
	 *
	 * @protected
	 */
	#ignored = new Set(["events"]);

	/**
	 * @name Listeners
	 *
	 * @description
	 * Registry of event listeners
	 *
	 * @type {Map}
	 *
	 * @protected
	 */
	#listeners = new Map();

	/**
	 * @name Constructor
	 *
	 * @description
	 * Initialize a hotline instance and shell of elements
	 *
	 * @param {HTMLElement} shell Shell
	 * @param {boolean} [inject=false] Write the hotline instance into the shell element?
	 **/
	constructor(shell, inject = false) {
		if (shell instanceof HTMLElement) {
			// Initialized the shell of elements

			// Writing the shell of elements
			this.#shell = shell;

			// Writing the hotline instance into the shell element
			if (inject) this.#shell.hotline = this;

			if (this.#shell.childElementCount > 1) {
				// More than 2 elements in the `this.#shell`

				// Writing status of the proccess
				this.#status = "ready";

				if (this.events.get("ready")) {
					// Requested triggering the "ready" event

					// Dispatching event: "ready"
					this.#shell.dispatchEvent(new CustomEvent("hotline.ready"));
				}
			}
		}
	}

	/**
	 * @name Start
	 *
	 * @description
	 * Start the process of the hotline instance
	 */
	start() {
		if (this.#process === null) {
			// Not found working process of the hotline instance

			// Initializing link to the instance
			const instance = this;

			// Creating a process
			this.#process = setInterval(() => {
				// Initializing the first element
				instance.#first.element = instance.#shell.firstElementChild;

				// Initializing shape of the first element
				instance.#first.rectangle = instance.#first.element.getBoundingClientRect();

				if (instance.vertical) {
					// Vertical

					// Initializing position of the first element (the movement is based on this property)
					instance.#first.position =
						parseFloat(instance.#first.element.style.marginTop) || 0;

					// Initializing offset of the first element (elements are separated like this)
					instance.#first.offset =
						parseFloat(getComputedStyle(instance.#first.element).marginBottom) || 0;

					// Initializing coordinate of the end of the first element
					instance.#first.end =
						instance.#first.rectangle.y +
						instance.#first.rectangle.height +
						instance.#first.offset;
				} else {
					// Horizontal

					// Initializing position of the first element (the movement is based on this property)
					instance.#first.position =
						parseFloat(instance.#first.element.style.marginLeft) || 0;

					// Initializing offset of the first element (elements are separated like this)
					instance.#first.offset =
						parseFloat(getComputedStyle(instance.#first.element).marginRight) || 0;

					// Initializing coordinate of the end of the first element
					instance.#first.end =
						instance.#first.rectangle.x +
						instance.#first.rectangle.width +
						instance.#first.offset;
				}

				if (
					(instance.vertical &&
						Math.round(instance.#first.end) < instance.#shell.offsetTop) ||
					(!instance.vertical &&
						Math.round(instance.#first.end) < instance.#shell.offsetLeft)
				) {
					// The first element with its separator went beyond the shell

					if (instance.transfer === true && instance.#transfer) {
						// Transfer is requested and allowed by system

						// Transfer the first element to the end of the shell
						instance.#shell.appendChild(instance.#first.element);

						if (instance.vertical) {
							// Vertical

							// Deleting position of the last (previously first) element (the movement is based on this property)
							instance.#first.element.style.marginTop = null;

							if (instance.events.get("transfer.end")) {
								// Requested triggering the "transfer.end" event

								// Dispatching event: "transfer.end"
								instance.#shell.dispatchEvent(
									new CustomEvent("hotline.transfer.end", {
										detail: {
											element: instance.#first.element,
											offset: -(instance.#first.rectangle.height + instance.#first.offset)
										}
									})
								);
							}

							// Deinitializing the first element
							instance.#first = {};
						} else {
							// Horizontal

							// Deleting position of the last (previously first) element (the movement is based on this property)
							instance.#first.element.style.marginLeft = null;

							if (instance.events.get("transfer.end")) {
								// Requested triggering the "transfer.end" event

								// Dispatching event: "transfer.end"
								instance.#shell.dispatchEvent(
									new CustomEvent("hotline.transfer.end", {
										detail: {
											element: instance.#first.element,
											offset: -(instance.#first.rectangle.width + instance.#first.offset)
										}
									})
								);
							}

							// Deinitializing the first element
							instance.#first = {};
						}
					}
				} else if (
					(instance.vertical &&
						Math.round(instance.#first.rectangle.y) > instance.#shell.offsetTop) ||
					(!instance.vertical &&
						Math.round(instance.#first.rectangle.x) > instance.#shell.offsetLeft)
				) {
					// Beginning border of first element with its separator went beyond the shell

					if (instance.transfer === true && instance.#transfer) {
						// Transfer is requested and allowed by system

						// Initializing the last element
						instance.#last.element = instance.#shell.lastElementChild;

						// Initializing shape of the last element
						instance.#last.rectangle = instance.#last.element.getBoundingClientRect();

						// Transfer the last element to the beginning of the shell
						instance.#shell.insertBefore(
							instance.#last.element,
							instance.#first.element
						);

						if (instance.vertical) {
							// Vertical

							// Initializing offset of the last element (elements are separated like this)
							instance.#last.offset =
								parseFloat(getComputedStyle(instance.#last.element).marginBottom) ||
								instance.#first.offset ||
								0;

							if (instance.events.get("transfer.beginning")) {
								// Requested triggering the "transfer.beginning" event

								// Dispatching event: "transfer.beginning"
								instance.#shell.dispatchEvent(
									new CustomEvent("hotline.transfer.beginning", {
										detail: {
											element: instance.#last.element,
											offset: instance.#last.rectangle.height + instance.#last.offset
										}
									})
								);
							}

							// Initializing the position of the last element with the end boundary beyond the beginning boundary of the shell
							instance.#last.element.style.marginTop =
								-instance.#last.rectangle.height - instance.#last.offset + "px";

							// Deleting position of the second (previously first) element (the movement is based on this property)
							instance.#first.element.style.marginTop = null;

							// Deinitializing the first element
							instance.#first = {};
						} else {
							// Horizontal

							// Initializing offset of the last element (elements are separated like this)
							instance.#last.offset =
								parseFloat(getComputedStyle(instance.#last.element).marginRight) ||
								instance.#first.offset ||
								0;

							if (instance.events.get("transfer.beginning")) {
								// Requested triggering the "transfer.beginning" event

								// Dispatching event: "transfer.beginning"
								instance.#shell.dispatchEvent(
									new CustomEvent("hotline.transfer.beginning", {
										detail: {
											element: instance.#last.element,
											offset: instance.#last.rectangle.width + instance.#last.offset
										}
									})
								);
							}

							// Initializing the position of the last element with the end boundary beyond the beginning boundary of the shell
							instance.#last.element.style.marginLeft =
								-instance.#last.rectangle.width - instance.#last.offset + "px";

							// Deleting position of the second (previously first) element (the movement is based on this property)
							instance.#first.element.style.marginLeft = null;

							// Deinitializing the first element
							instance.#first = {};
						}
					}
				} else {
					// The first element is entirely inside the shell

					if (this.alive === true && this.#freezed === false) {
						// Movement is requested and the hotline instance is not frozen

						// Moving elements
						instance.move();
					}
				}
			}, instance.interval);

			if (this.hover) {
				// Requested freezing the hotline instance when the user cursor is over the this.#shell

				// Initializing event listener for hovering elements by the user
				this.#listeners.set("hover", (hover) => {
					// The user hovers the mouse cursor over `this.#shell`

					// Freezing the hotline instance (stopping movement of elements by themselves)
					instance.#freezed = true;

					if (instance.events.get("moving.freezed")) {
						// Requested triggering the "moving.freezed" event

						// Dispatching event: "moving.freezed"
						instance.#shell.dispatchEvent(
							new CustomEvent("hotline.moving.freezed", {
								detail: { event: hover }
							})
						);
					}
				});

				// Connecting event listener for hovering elements by the user
				this.#shell.addEventListener("mouseover", this.#listeners.get("hover"));
			} else {
				// Not requested freezing the hotline instance when the user cursor is over the this.#shell

				// Disconnecting event listener for hovering elements by the user
				this.#shell.removeEventListener("mouseover", this.#listeners.get("hover"));

				// Deinitializing event listener for hovering elements by the user
				this.#listeners.delete("hover");
			}

			if (this.wheel) {
				// Requested moving elements by the user mouse whell

				// Initializing event listener for moving elements by the user mouse wheel
				this.#listeners.set("wheel", (wheel) => {
					// The user moves elements by the mouse wheel

					if (instance.#status === "started") {
						// The hotline instance is started

						// Writing new position coordinate for the first element (moving)
						instance.position(
							(parseFloat(
								instance.#shell.firstElementChild.style[
									instance.vertical ? "marginTop" : "marginLeft"
								]
							) || 0) +
								(instance.delta === null
									? wheel.wheelDelta
									: wheel.wheelDelta > 0
									? instance.delta
									: -instance.delta)
						);
					}
				});

				// Connecting event listener for moving elements by the user mouse wheel
				this.#shell.addEventListener("wheel", this.#listeners.get("wheel"));
			} else {
				// Not requested moving elements by the user mouse whell

				// Disconnecting event listener for moving elements by the user mouse wheel
				this.#shell.removeEventListener("wheel", this.#listeners.get("wheel"));

				// Deinitializing event listener for moving elements by the user mouse wheel
				this.#listeners.delete("wheel");
			}

			// Initializing buffer for generating new position of the first element
			let position = 0;

			// Initializing event listeners for transfered elements that moved by the user (mouse, touch)
			const transfer = function (event) {
				// The element was transfered while moved by the user (mouse, touch)

				// Generating and writing position of the first element
				position += event.detail.offset ?? 0;
			};

			if (instance.movable) {
				// Requested moving elements by the user (mouse, touch)

				// Initializing event listener for starting moving elements by the user (mouse, touch)
				instance.#listeners.set("move.start", (start) => {
					// Elements have started to be moved by the user (mouse, touch)

					if (start.type === "touchstart" || start.button === instance.button) {
						// Pressing with a finger or a mouse button specified in `this.button` by the user (mouse, touch)

						// Freezing the hotline instance (stopping movement of elements by themselves)
						instance.#freezed = true;

						if (instance.events.get("moving.freezed")) {
							// Requested triggering the "moving.freezed" event

							// Dispatching event: "moving.freezed"
							instance.#shell.dispatchEvent(
								new CustomEvent("hotline.moving.freezed", {
									detail: { event: start }
								})
							);
						}

						// Initializing the start coordinates of the movement by the user (mouse, touch)
						const x = start.pageX || (start.touches && start.touches[0]?.pageX) || 0;
						const y = start.pageY || (start.touches && start.touches[0]?.pageY) || 0;

						// Connecting event listener for transfer elements to the beginning
						instance.#shell.addEventListener("hotline.transfer.beginning", transfer);

						// Connecting event listener for transfer elements to the end
						instance.#shell.addEventListener("hotline.transfer.end", transfer);

						// Initializing initial position
						const initial = instance.#first.position;

						// Initializing event listeners for moving elements by the user (cursor, touch)
						instance.#listeners.set("moving", (move) => {
							// The user moves elements (cursor, touch)

							if (instance.#status === "started") {
								// The hotline instance is started

								// Writing the status that elements are currently being moved by the user
								instance.#moving = true;

								if (instance.vertical) {
									// Vertical

									// Initializing coordinate
									const coordinate =
										move.pageY || (move.touches && move.touches[0].pageY) || 0;

									// Writing new position coordinate for the first element (moving)
									instance.position(coordinate - (y + position - initial));
								} else {
									// Horizontal

									// Initializing coordinate
									const coordinate =
										move.pageX || (move.touches && move.touches[0].pageX) || 0;

									// Writing new position coordinate for the first element (moving)
									instance.position(coordinate - (x + position - initial));
								}

								if (move.type === "mousemove") {
									// Elements are moved by the user using the mouse

									if (instance.events.get("move.mouse")) {
										// Requested triggering the "move.mouse" event

										// Dispatching event: "move.mouse"
										instance.#shell.dispatchEvent(
											new CustomEvent("hotline.move.mouse", {
												detail: { from: initial, to: instance.#first.position }
											})
										);
									}
								} else if (move.type === "touchmove") {
									// Elements are moved by the user using touches

									if (instance.events.get("move.touch")) {
										// Requested triggering the "move.touch" event

										// Dispatching event: "move.touch"
										instance.#shell.dispatchEvent(
											new CustomEvent("hotline.move.touch", {
												detail: { from: initial, to: instance.#first.position }
											})
										);
									}
								}
							}
						});

						// Connecting event listener for moving elements by the user mouse
						document.addEventListener("mousemove", instance.#listeners.get("moving"));

						// Connecting event listener for moving elements by the user touches
						document.addEventListener("touchmove", instance.#listeners.get("moving"));
					}
				});

				// Connecting event listener for starting moving elements by the user mouse
				instance.#shell.addEventListener(
					"mousedown",
					instance.#listeners.get("move.start")
				);

				// Connecting event listener for starting moving elements by the user touch
				instance.#shell.addEventListener(
					"touchstart",
					instance.#listeners.get("move.start")
				);

				// Initializing event listener for leaving the user cursor from the document area
				instance.#listeners.set("move.leaved", () => {
					// The user mouse cursor is leave the document area

					// Disconnecting event listener for moving elements by the user mouse
					document.removeEventListener(
						"mousemove",
						instance.#listeners.get("moving")
					);

					// Deinitializing event listener for moving elements by the user touch
					instance.#listeners.delete("moving");

					// Disconnecting event listener for leaving the user cursor from the document area
					document.removeEventListener(
						"mouseleave",
						instance.#listeners.get("move.leaved")
					);
				});

				// Connecting event listener for leaving the user cursor from the document area
				document.addEventListener(
					"mouseleave",
					instance.#listeners.get("move.leaved")
				);

				// Initializing event listeners for ending moving elements by the user (mouse, touch)
				instance.#listeners.set("move.end", (end) => {
					// Elements have ended to be moved by the user (mouse, touch)

					// Writing the status that elements are currently not being moved by the user
					instance.#moving = false;

					// Disconnecting event listener for moving elements by the user mouse
					document.removeEventListener(
						"mousemove",
						instance.#listeners.get("moving")
					);

					// Disconnecting event listener for moving elements by the user touch
					document.removeEventListener(
						"touchmove",
						instance.#listeners.get("moving")
					);

					// Deinitializing event listener for moving elements by the user touch
					instance.#listeners.delete("moving");

					// Reinitializing buffer for generating new position of the first element
					position = 0;

					// Disconnecting event listener for transfer elements to the beginning
					instance.#shell.removeEventListener(
						"hotline.transfer.beginning",
						transfer
					);

					// Disconnecting event listener for transfer elements to the end
					instance.#shell.removeEventListener("hotline.transfer.end", transfer);

					if (instance.hover !== false || !instance.#shell.contains(end.target)) {
						// Not requested freezing or not the user cursor hovered `instance.#shell`

						// Unfreezing the hotline instance (starting movement of elements by themselves)
						instance.#freezed = false;

						if (instance.events.get("move.unfreezed")) {
							// Requested triggering the "move.unfreezed" event

							// Dispatching event: "move.unfreezed"
							instance.#shell.dispatchEvent(new CustomEvent("hotline.move.unfreezed"));
						}
					}

					if (instance.magnetic !== null) {
						// Requested to magnetize the first element

						if (end.target === instance.#shell) {
							// Target is `instance.#shell`
						} else {
							// Target is not `instance.#shell`

							// Initializing buffer of the target element
							let element = end.target;

							// Initializing counter of iterations
							let i = 100;

							while (element.parentElement !== instance.#shell && --i !== 0) {
								// Search for the target element

								// Writing the possible target element
								element = element.parentElement;
							}

							if (
								element instanceof HTMLElement &&
								element.parentElement === instance.#shell
							) {
								// Initialized the target element

								// Magnetizing the first element
								instance.magnetize(element, instance.magnetic);
							}
						}
					}
				});

				// Connecting event listeners for ending moving elements by the user mouse
				instance.#shell.addEventListener(
					"mouseup",
					instance.#listeners.get("move.end")
				);

				// Connecting event listeners for ending moving elements by the user touch
				instance.#shell.addEventListener(
					"touchend",
					instance.#listeners.get("move.end")
				);

				// Initializing event listeners for leaving the user mouse cursor from the shell
				instance.#listeners.set("move.leave", (leave) => {
					// The user mouse cursor leaved `this.#shell` area

					// Reinitializing buffer for generating new position of the first element
					position = 0;

					if (instance.sticky === false) {
						// Not requested to stick the user mouse cursor to `this.#shell`

						// Writing the status that elements are currently not being moved by the user
						instance.#moving = false;

						// Disconnecting event listener for moving elements by the user mouse
						document.removeEventListener(
							"mousemove",
							instance.#listeners.get("moving")
						);

						// Disconnecting event listener for moving elements by the user touch
						document.removeEventListener(
							"touchmove",
							instance.#listeners.get("moving")
						);

						// Deinitializing event listener for moving elements by the user touch
						instance.#listeners.delete("moving");

						// Disconnecting event listener for transfer elements to the beginning
						instance.#shell.removeEventListener(
							"hotline.transfer.beginning",
							transfer
						);

						// Disconnecting event listener for transfer elements to the end
						instance.#shell.removeEventListener("hotline.transfer.end", transfer);
					}

					// Unfreezing the hotline instance (starting movement of elements by themselves)
					instance.#freezed = false;

					if (instance.events.get("move.unfreezed")) {
						// Requested triggering the "move.unfreezed" event

						// Dispatching event: "move.unfreezed"
						instance.#shell.dispatchEvent(new CustomEvent("hotline.move.unfreezed"));
					}
				});

				// Connecting event listener for leaving the user mouse cursor from the shell
				instance.#shell.addEventListener(
					"mouseleave",
					instance.#listeners.get("move.leave")
				);
			} else {
				// Not requested moving elements by the user (mouse, touch)

				// Disconnecting event listener for starting moving elements by the user mouse
				instance.#shell.removeEventListener(
					"mousedown",
					instance.#listeners.get("move.start")
				);

				// Disconnecting event listener for starting moving elements by the user touch
				instance.#shell.removeEventListener(
					"touchstart",
					instance.#listeners.get("move.start")
				);

				// Deinitializing event listener for starting moving elements by the user (mouse, touch)
				instance.#listeners.delete("move.start");

				// Writing the status that elements are currently not being moved by the user
				instance.#moving = false;

				// Disconnecting event listener for moving elements by the user mouse
				document.removeEventListener(
					"mousemove",
					instance.#listeners.get("moving")
				);

				// Disconnecting event listener for moving elements by the user touch
				document.removeEventListener(
					"touchmove",
					instance.#listeners.get("moving")
				);

				// Deinitializing event listener for moving elements by the user touch
				instance.#listeners.delete("moving");

				// Reinitializing buffer for generating new position of the first element
				position = 0;

				// Disconnecting event listeners for ending moving elements by the user mouse
				instance.#shell.removeEventListener(
					"mouseup",
					instance.#listeners.get("move.end")
				);

				// Disconnecting event listeners for ending moving elements by the user touch
				instance.#shell.removeEventListener(
					"touchend",
					instance.#listeners.get("move.end")
				);

				// Deinitializing event listener for ending moving elements by the user (mouse, touch)
				instance.#listeners.delete("move.end");

				// Disconnecting event listener for leaving the user mouse cursor from the shell
				instance.#shell.addEventListener(
					"mouseleave",
					instance.#listeners.get("move.leave")
				);

				// Deinitializing event listener for leaving the user mouse cursor from the shell
				instance.#listeners.delete("move.leave");
			}

			// Writing status of the proccess
			this.#status = "started";

			if (instance.events.get("started")) {
				// Requested triggering the "started" event

				// Dispatching event: "started"
				this.#shell.dispatchEvent(new CustomEvent("hotline.started"));
			}
		}

		if (this.observe) {
			// Requester observing for changing `this.#shell` attributes values

			if (this.#observer === null) {
				// Not initialized the observer instance

				// Initializing the observer instance
				this.#observer = new MutationObserver(function (mutations) {
					// Detected mutation

					for (const mutation of mutations) {
						// Iterating over mutations

						if (mutation.type === "attributes") {
							// Attribute was changed

							// Reinitializing property by new value of the attribute
							this.configure(mutation.attributeName);
						}
					}

					// Restarting the hotline instance
					this.restart();
				});

				// Starting observation for attributes mutations in the `this.#shell`
				this.#observer.observe(this.#shell, {
					attributes: true
				});

				if (this.events.get("observer.started")) {
					// Requested triggering the "observer.started" event

					// Dispatching event: "observer.stopped"
					this.#shell.dispatchEvent(
						new CustomEvent("hotline.observer.started", {
							detail: {
								instance: this.#observer
							}
						})
					);
				}
			}
		} else if (this.#observer instanceof MutationObserver) {
			// Not requested observing for changing `this.#shell` attributes values but found the observer instance

			// Stoppingobservation for attributes mutations in the `this.#shell`
			this.#observer.disconnect();

			// Deleting the observer instance
			this.#observer = null;

			if (this.events.get("observer.stopped")) {
				// Requested triggering the "observer.stopped" event

				// Dispatching event: "observer.stopped"
				this.#shell.dispatchEvent(new CustomEvent("hotline.observer.stopped"));
			}
		}
	}

	/**
	 * @name Stop
	 *
	 * @description
	 * Stop the process of the hotline instance
	 */
	stop() {
		// Stopping the process
		clearInterval(this.#process);

		// Deleting identifier of the proccess
		this.#process = null;

		// Writing status of the proccess
		this.#status = "stopped";

		if (this.events.get("stopped")) {
			// Requested triggering the "stopped" event

			// Dispatching event: "stopped"
			this.#shell.dispatchEvent(new CustomEvent("hotline.stopped"));
		}
	}

	/**
	 * @name Restart
	 *
	 * @description
	 * Stop and start the process of the hotline instance
	 */
	restart() {
		// Stopping the hotline instance
		this.stop();

		// Starting the hotline instance
		this.start();
	}

	/**
	 * @name Configure
	 *
	 * @description
	 * Validate attribute and write parameter with its value
	 *
	 * @param {string} attribute HTMLElement attribute
	 */
	configure(attribute) {
		// Initializing parameter name
		const name = (/^data-hotline-(\w+)$/.exec(attribute) ?? [, null])[1];

		if (typeof name === "string") {
			// Validated parameter name

			// Is the parameter allowed to be change?
			if (this.#ignored.has(name)) return;

			// Initializing parameter value
			const value = this.#shell.getAttribute(attribute);

			if (name === "magnetic" && typeof this.magnetism[value] === "symbol") {
				// Validated magnetism area value

				// Writing implemented value to the parameter
				this.magnetic = this.magnetism[value];
			} else if (typeof value === "string") {
				// Validated parameter value

				if (value === "true" || value === "on" || value === "yes") {
					// True

					// Writing implemented value to the parameter
					this[name] = true;
				} else if (value === "false" || value === "off" || value === "no") {
					// False

					// Writing implemented value to the parameter
					this[name] = false;
				} else {
					// Number or string

					// Writing value to the parameter
					this[name] = parseFloat(value) || value;
				}

				if (this.events.get("configured")) {
					// Requested triggering the "configured" event

					// Dispatching event: "configured"
					this.#shell.dispatchEvent(
						new CustomEvent("hotline.configured", {
							detail: {
								name,
								value: this[name]
							}
						})
					);
				}
			}
		}
	}

	/**
	 * @name Position
	 *
	 * @description
	 * Write position of the first element (margin to the left or the top)
	 *
	 * This method is used to move elements.
	 *
	 * @param {number} value Coordinate
	 *
	 * @return {number|null} Offset of new position from old position of the first element
	 */
	position(value) {
		// Initializing old position of the first element
		const old = this.#first.position || undefined;

		if (typeof this.#first.element === "undefined") {
			// Not initialized the first element

			// Initializing the first element
			this.#first.element = this.#shell.firstElementChild;
		}

		if (this.#first.element instanceof HTMLElement) {
			// Initialized the first element

			// Writing new position of the first element to the property
			this.#first.position = value;

			// Writing new position of the first element to the element
			this.#first.element.style[this.vertical ? "marginTop" : "marginLeft"] =
				this.#first.position + "px";

			if (this.events.get("position")) {
				// Requested triggering the "position" event

				// Dispatching event: "position"
				this.#shell.dispatchEvent(
					new CustomEvent("hotline.position", {
						detail: {
							from: old,
							to: value
						}
					})
				);
			}

			// Calculating offset of new position from old position and exit (success)
			return value - (old || 0);
		}

		// Exit (fail)
		return null;
	}

	/**
	 * @name Move
	 *
	 * @description
	 * Move the first element (margin to the left or the top)
	 *
	 * This method is used to move elements.
	 *
	 * @param {number} [step] step Direction and speed of movement (otherwise `this.step`)
	 *
	 * @return {number|null} Offset of new position from old position of the first element
	 */
	move(step) {
		// Initializing obsolete position coordinate (`x` or `y` by `this.vertical`)
		const obsolete = this.#first.position;

		// Initializing actual position coordinate (`x` or `y` by `this.vertical`)
		const coordinate = this.#first.position + (step || this.step);

		// Writing new position coordinate to the first element (moving)
		const moved = this.position(coordinate);

		if (this.events.get("moving")) {
			// Requested triggering the "moving" event

			// Dispatching event: "moving"
			document.dispatchEvent(
				new CustomEvent("hotline.moving", {
					detail: {
						from: obsolete,
						to: coordinate
					}
				})
			);
		}

		// Exit (success)
		return moved;
	}

	/**
	 * @name Move forward
	 *
	 * @description
	 * Moving the first element forward untill the last element be transfered to the first element position
	 *
	 * This method is used to move elements.
	 *
	 * @return {Promise}
	 */
	forward() {
		return new Promise((resolve, reject) => {
			// Declaring timer of the forced stopping the moving process
			let timer;

			// Initializing speed of movement
			let step = Math.abs(this.step) || 1;

			// Starting moving proccess
			const moving = setInterval(() => {
				// Increasing the speed of movement with each iteration
				++step;

				// Moving
				this.move(step);
			}, this.interval);

			// Initializing function for event listener for stopping movement when the last element be transferred to the first element position
			const stopping = () => {
				if (step > 10) {
					// More than 10 pixels have been passed (used to fix the 1 pixel movement bug)

					// Deinitializingt the moving process
					clearInterval(moving);

					// Deinitializing the timer of the forced stopping the moving process
					clearTimeout(timer);

					if (this.events.get("moved.forward")) {
						// Requested triggering the "moved.forward" event

						// Dispatching event: "moved.forward"
						this.#shell.dispatchEvent(new CustomEvent("hotline.moved.forward"));
					}

					// Disconnecting event listener for stopping movement when the last element be transferred to the first element position
					this.#shell.removeEventListener("hotline.transfer.beginning", stopping);

					// Exit (success)
					resolve();
				}
			};

			// Connecting event listener for stopping movement when the last element be transferred to the first element position
			this.#shell.addEventListener("hotline.transfer.beginning", stopping, false);

			// Initializing timer of the forced stopping the moving process
			timer = setTimeout(() => {
				// Deinitializing the moving process
				clearTimeout(moving);

				// Exit (fail)
				reject();
			}, 5000);
		});
	}

	/**
	 * @name Move backward
	 *
	 * @description
	 * Moving the first element backward untill the first element be transfered to the last element position
	 *
	 * This method is used to move elements.
	 *
	 * @return {Promise}
	 */
	backward() {
		return new Promise((resolve, reject) => {
			// Declaring timer of the forced stopping the moving process
			let timer;

			// Initializing speed of movement
			let step = -Math.abs(this.step) || -1;

			// Starting moving proccess
			const moving = setInterval(() => {
				// Increasing the speed of movement with each iteration
				--step;

				// Moving
				this.move(step);
			}, this.interval);

			// Initializing function for event listener for stopping movement when the first element be transferred to the last element position
			const stopping = () => {
				if (step < -10) {
					// More than 10 pixels have been passed (used to fix the 1 pixel movement bug)

					// Deinitializingt the moving process
					clearInterval(moving);

					// Deinitializing the timer of the forced stopping the moving process
					clearTimeout(timer);

					if (this.events.get("moved.backward")) {
						// Requested triggering the "moved.backward" event

						// Dispatching event: "moved.backward"
						this.#shell.dispatchEvent(new CustomEvent("hotline.moved.backward"));
					}

					// Disconnecting event listener for stopping movement when the first element be transferred to the last element position
					this.#shell.removeEventListener("hotline.transfer.end", stopping);

					// Exit (success)
					resolve();
				}
			};

			// Connecting event listener for stopping movement when the first element be transferred to the last element position
			this.#shell.addEventListener("hotline.transfer.end", stopping, false);

			// Initializing timer of the forced stopping the moving process
			timer = setTimeout(() => {
				// Deinitializing the moving process
				clearTimeout(moving);

				// Exit (fail)
				reject();
			}, 5000);
		});
	}

	/**
	 * @name Magnetize
	 *
	 * @description
	 * Move the target element to the specified area and stop
	 *
	 * This method is used to move elements.
	 *
	 * To use this method you must have a fixed size of `this.#shell`,
	 * otherwise `this.#shell.getBoundingClientRect()` will return the result
	 * of the entire length including hidden elements.
	 *
	 * ⚠️ At the moment, the element does not always stopped exactly in the desired position.
	 * The error in getting into the desired area depends on the settings.
	 * If you want to stop elements for users to view, then use `this.forward` and `this.backward`,
	 * setting event listeners on them to implement the "swipe right" and "swipe left" technology,
	 * as well as the "keydown" for the "<-" and "->" buttons on the keyboard.
	 *
	 * @param {HTMLElement} element Target element that will be magnetized
	 * @param {magnetism.<symbol>} magnetism Magnetism area
	 *
	 * @return {Promise}
	 */
	magnetize(element, magnetism) {
		return new Promise((resolve, reject) => {
			if (element instanceof HTMLElement) {
				// Initialized the element

				// Initializing shape of the target element
				const target = element.getBoundingClientRect();

				// Initializing shape of the shell element
				const shell = this.#shell.getBoundingClientRect();

				// Declaring offset center of the target element from center of the shell element
				let offset;

				switch (magnetism) {
					case this.#magnetism.beginning:
						// Beginning area

						// wait for updates
						break;
					case this.#magnetism.center:
						// Central area

						// Calculating and writing offset of the target element center from the shell element center
						offset = target.x + target.width / 2 - (shell.x + shell.width / 2);
						break;
					case this.#magnetism.end:
						// End area

						// wait for updates
						break;
					default:
						return;
				}

				if (offset > 0) {
					// The target element center is ahead of the shell element center (right or bottom by `this.vertical`)

					// Declaring timer of the forced stopping the magnetizing process
					let timer;

					// Initializing speed of movement
					let step = -Math.abs(this.magnet) || -Math.abs(this.step) || 0;

					// Starting magnetizing proccess (moving)
					const magnet = setInterval(() => {
						// Increasing the speed of movement with each iteration
						--step;

						// Calculating brake
						const brake = offset + step;

						if (brake <= 0) {
							// The target element center is going to pass the shell element center

							// Changing step length to reach the shell element center
							step = -offset;
						}

						// Moving
						offset += this.move(step) || 0;

						if (offset === 0) {
							// The target element center has reached the shell element center

							// Deinitializingt the magnetizing process
							clearInterval(magnet);

							// Deinitializing the timer of the forced stopping the magnetizing process
							clearTimeout(timer);

							if (this.events.get("magnetized")) {
								// Requested triggering the "magnetized" event

								// Dispatching event: "magnetized"
								this.#shell.dispatchEvent(
									new CustomEvent("hotline.magnetized", {
										detail: {
											magnetism: magnetism
										}
									})
								);
							}

							// Exit (success)
							resolve(magnetism);
						}
					}, this.interval);

					// Initializing timer of the forced stopping the magnetizing process
					timer = setTimeout(() => {
						// Deinitializing the magnetizing process
						clearTimeout(magnet);

						// Exit (fail)
						reject();
					}, 5000);
				} else if (offset < 0) {
					// The target element center is behind of the shell element center (left or top by `this.vertical`)

					// Declaring timer of the forced stopping the magnetizing process
					let timer;

					// Initializing speed of movement
					let step = Math.abs(this.magnet) || Math.abs(this.step) || 0;

					// Starting magnetizing proccess (moving)
					const magnet = setInterval(() => {
						// Increasing the speed of movement with each iteration
						++step;

						// Calculating brake
						const brake = offset + step;

						if (brake >= 0) {
							// The target element center is going to pass the shell element center

							// Changing step length to reach the shell element center
							step = -offset;
						}

						// Moving
						offset += this.move(step) || 0;

						if (offset === 0) {
							// The target element center has reached the shell element center

							// Deinitializingt the magnetizing process
							clearInterval(magnet);

							// Deinitializing the timer of the forced stopping the magnetizing process
							clearTimeout(timer);

							if (this.events.get("magnetized")) {
								// Requested triggering the "magnetized" event

								// Dispatching event: "magnetized"
								this.#shell.dispatchEvent(
									new CustomEvent("hotline.magnetized", {
										detail: {
											magnetism: magnetism
										}
									})
								);
							}

							// Exit (success)
							resolve(magnetism);
						}
					}, this.interval);

					// Initializing timer of the forced stopping the magnetizing process
					timer = setTimeout(() => {
						// Deinitializing the magnetizing process
						clearTimeout(magnet);

						// Exit (fail)
						reject();
					}, 5000);
				} else {
					// The target element center has reached the shell element center

					if (this.events.get("magnetized")) {
						// Requested triggering the "magnetized" event

						// Dispatching event: "magnetized"
						this.#shell.dispatchEvent(
							new CustomEvent("hotline.magnetized", {
								detail: {
									magnetism: magnetism
								}
							})
						);
					}

					// Exit (success)
					resolve(magnetism);
				}
			}
		});
	}

	/**
	 * @name Preprocessing
	 *
	 * @description
	 * Read the DOM, identify shells and generate the hotline instances.
	 *
	 * It is a rather slow process, but very convenient.
	 * Personally, i do not recommend using it.
	 *
	 * @param {boolean} [event=false] Dispatch "hotline.preprocessed" event? (contains return values)
	 * @param {boolean} [inject=false] Write the hotline instance into the shell element?
	 *
	 * @return {Set} Generated the hotline instances
	 */
	static preprocessing(event = false, inject = false) {
		// Initializing registry of generated the hotline instances
		const generated = new Set();

		// Initializing counter of errors
		let error = 0;

		for (const shell of document.querySelectorAll('*[data-hotline="true"]')) {
			// Iterating over found shells with the hotline attributes

			// Initializing the hotline instance
			const instance = new this(shell, inject);

			for (const attribute of shell.getAttributeNames()) {
				// Iterating over the shell attributes

				// Initializing property by value of the attribute
				instance.configure(attribute);
			}

			// Starting the hotline instance
			instance.start();

			// Writing into registry of generated the hotline instances
			generated.add(instance);
		}

		if (event) {
			// Requested triggering the "hotline.preprocessed" event

			// Dispatching event: "hotline.preprocessed"
			document.dispatchEvent(new CustomEvent("hotline.preprocessed"), {
				detail: {
					generated
				}
			});
		}

		// Exit (success)
		return generated;
	}
}