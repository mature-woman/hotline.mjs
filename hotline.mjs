"use strict";

/**
 * @name hotline.mjs
 *
 * @description Module for creating "hot lines"
 *
 * @example
 * сonst hotline = new hotline();
 * hotline.step = '-5';
 * hotline.start();
 *
 * {@link https://git.mirzaev.sexy/mirzaev/hotline.js Repository}
 *
 * @license http://www.wtfpl.net/ Do What The Fuck You Want To Public License
 * @author Arsen Mirzaev Tatyano-Muradovich <arsen@mirzaev.sexy>
 */
export default class hotline {
	// Идентификатор
	#id = 0;

	// Оболочка (instanceof HTMLElement)
	#shell = document.getElementById("hotline");

	// Инстанция горячей строки
	#instance = null;

	// Перемещение
	#transfer = true;

	// Движение
	#move = true;

	// Наблюдатель
	#observer = null;

	// Реестр запрещённых к изменению параметров
	#block = new Set(["events"]);

	// Status (null, active, inactive)
	#status = null;

	// Settings
	transfer = null;
	move = null;
	delay = 10;
	step = 1;
	hover = true;
	movable = true;
	sticky = false;
	wheel = false;
	delta = null;
	vertical = false;
	button = 0; // button for grabbing. 0 is main mouse button (left)
	observe = false;
	events = new Map([
		["start", false],
		["stop", false],
		["move", false],
		["move.block", false],
		["move.unblock", false],
		["offset", false],
		["transfer.start", true],
		["transfer.end", true],
		["mousemove", false],
		["touchmove", false],
	]);

	// Is hotline currently moving due to "onmousemove" or "ontouchmove"?
	moving = false;

	constructor(id, shell) {
		// Запись идентификатора
		if (typeof id === "string" || typeof id === "number") this.#id = id;

		// Запись оболочки
		if (shell instanceof HTMLElement) this.#shell = shell;
	}

	start() {
		if (this.#instance === null) {
			// Нет запущенной инстанции бегущей строки

			// Инициализация ссылки на ядро
			const _this = this;

			// Запуск движения
			this.#instance = setInterval(function () {
				if (_this.#shell.childElementCount > 1) {
					// Найдено содержимое бегущей строки (2 и более)

					// Инициализация буфера для временных данных
					let buffer;

					// Инициализация данных первого элемента в строке
					const first = {
						element: (buffer = _this.#shell.firstElementChild),
						coords: buffer.getBoundingClientRect(),
					};

					if (_this.vertical) {
						// Вертикальная бегущая строка

						// Инициализация сдвига у первого элемента (движение)
						first.offset = isNaN(
								buffer = parseFloat(first.element.style.marginTop),
							)
							? 0
							: buffer;

						// Инициализация отступа до второго элемента у первого элемента (разделение)
						first.separator = isNaN(
								buffer = parseFloat(
									getComputedStyle(first.element).marginBottom,
								),
							)
							? 0
							: buffer;

						// Инициализация крайнего с конца ребра первого элемента в строке
						first.end = first.coords.y + first.coords.height +
							first.separator;
					} else {
						// Горизонтальная бегущая строка

						// Инициализация отступа у первого элемента (движение)
						first.offset = isNaN(
								buffer = parseFloat(first.element.style.marginLeft),
							)
							? 0
							: buffer;

						// Инициализация отступа до второго элемента у первого элемента (разделение)
						first.separator = isNaN(
								buffer = parseFloat(
									getComputedStyle(first.element).marginRight,
								),
							)
							? 0
							: buffer;

						// Инициализация крайнего с конца ребра первого элемента в строке
						first.end = first.coords.x + first.coords.width +
							first.separator;
					}

					if (
						(_this.vertical &&
							Math.round(first.end) < _this.#shell.offsetTop) ||
						(!_this.vertical &&
							Math.round(first.end) < _this.#shell.offsetLeft)
					) {
						// Элемент (вместе с отступом до второго элемента) вышел из области видимости (строки)

						if (
							(_this.transfer === null && _this.#transfer) ||
							_this.transfer === true
						) {
							// Перенос разрешен

							if (_this.vertical) {
								// Вертикальная бегущая строка

								// Удаление отступов (движения)
								first.element.style.marginTop = null;
							} else {
								// Горизонтальная бегущая строка

								// Удаление отступов (движения)
								first.element.style.marginLeft = null;
							}

							// Копирование первого элемента в конец строки
							_this.#shell.appendChild(first.element);

							if (_this.events.get("transfer.end")) {
								// Запрошен вызов события: "перемещение в конец"

								// Вызов события: "перемещение в конец"
								document.dispatchEvent(
									new CustomEvent(`hotline.${_this.#id}.transfer.end`, {
										detail: {
											element: first.element,
											offset: -(
												(_this.vertical
													? first.coords.height
													: first.coords.width) + first.separator
											),
										},
									}),
								);
							}
						}
					} else if (
						(_this.vertical &&
							Math.round(first.coords.y) > _this.#shell.offsetTop) ||
						(!_this.vertical &&
							Math.round(first.coords.x) > _this.#shell.offsetLeft)
					) {
						// Передняя (движущая) граница первого элемента вышла из области видимости

						if (
							(_this.transfer === null && _this.#transfer) ||
							_this.transfer === true
						) {
							// Перенос разрешен

							// Инициализация отступа у последнего элемента (разделение)
							const separator = (buffer = isNaN(
										buffer = parseFloat(
											getComputedStyle(_this.#shell.lastElementChild)[
												_this.vertical ? "marginBottom" : "marginRight"
											],
										),
									)
									? 0
									: buffer) === 0
								? first.separator
								: buffer;

							// Инициализация координат первого элемента в строке
							const coords = _this.#shell.lastElementChild
								.getBoundingClientRect();

							if (_this.vertical) {
								// Вертикальная бегущая строка

								// Удаление отступов (движения)
								_this.#shell.lastElementChild.style.marginTop = -coords.height -
									separator + "px";
							} else {
								// Горизонтальная бегущая строка

								// Удаление отступов (движения)
								_this.#shell.lastElementChild.style.marginLeft = -coords.width -
									separator + "px";
							}

							// Копирование последнего элемента в начало строки
							_this.#shell.insertBefore(
								_this.#shell.lastElementChild,
								first.element,
							);

							// Удаление отступов у второго элемента в строке (движения)
							_this.#shell.children[1].style[
								_this.vertical ? "marginTop" : "marginLeft"
							] = null;

							if (_this.events.get("transfer.start")) {
								// Запрошен вызов события: "перемещение в начало"

								// Вызов события: "перемещение в начало"
								document.dispatchEvent(
									new CustomEvent(`hotline.${_this.#id}.transfer.start`, {
										detail: {
											element: _this.#shell.lastElementChild,
											offset: (_this.vertical ? coords.height : coords.width) +
												separator,
										},
									}),
								);
							}
						}
					} else {
						// Элемент в области видимости

						if (
							(_this.move === null && _this.#move) || _this.move === true
						) {
							// Движение разрешено

							// Запись новых координат сдвига
							const offset = first.offset + _this.step;

							// Запись сдвига (движение)
							_this.offset(offset);

							if (_this.events.get("move")) {
								// Запрошен вызов события: "движение"

								// Вызов события: "движение"
								document.dispatchEvent(
									new CustomEvent(`hotline.${_this.#id}.move`, {
										detail: {
											from: first.offset,
											to: offset,
										},
									}),
								);
							}
						}
					}
				}
			}, _this.delay);

			if (this.hover) {
				// Запрошена возможность останавливать бегущую строку

				// Инициализация сдвига
				let offset = 0;

				// Инициализация слушателя события при перемещении элемента в бегущей строке
				const listener = function (e) {
					// Увеличение сдвига
					offset += e.detail.offset ?? 0;
				};

				// Объявление переменной в области видимости обработки остановки бегущей строки
				let move;

				// Инициализация обработчика наведения курсора (остановка движения)
				this.#shell.onmouseover = function (e) {
					// Курсор наведён на бегущую строку

					// Блокировка движения
					_this.#move = false;

					if (_this.events.get("move.block")) {
						// Запрошен вызов события: "блокировка движения"

						// Вызов события: "блокировка движения"
						document.dispatchEvent(
							new CustomEvent(`hotline.${_this.#id}.move.block`),
						);
					}
				};

				if (this.movable) {
					// Запрошена возможность двигать бегущую строку

					_this.#shell.onmousedown =
						_this.#shell.ontouchstart =
							function (
								start,
							) {
								// Handling a "mousedown" and a "touchstart" on hotline

								if (
									start.type === "touchstart" ||
									start.button === _this.button
								) {
									const x = start.pageX || start.touches[0].pageX;
									const y = start.pageY || start.touches[0].pageY;

									// Блокировка движения
									_this.#move = false;

									if (_this.events.get("move.block")) {
										// Запрошен вызов события: "блокировка движения"

										// Вызов события: "блокировка движения"
										document.dispatchEvent(
											new CustomEvent(`hotline.${_this.#id}.move.block`),
										);
									}

									// Инициализация слушателей события перемещения элемента в бегущей строке
									document.addEventListener(
										`hotline.${_this.#id}.transfer.start`,
										listener,
									);
									document.addEventListener(
										`hotline.${_this.#id}.transfer.end`,
										listener,
									);

									// Инициализация буфера для временных данных
									let buffer;

									// Инициализация данных первого элемента в строке
									const first = {
										offset: isNaN(
												buffer = parseFloat(
													_this.vertical
														? _this.#shell.firstElementChild.style
															.marginTop
														: _this.#shell.firstElementChild.style
															.marginLeft,
												),
											)
											? 0
											: buffer,
									};

									move = (move) => {
										// Обработка движения курсора

										if (_this.#status === "active") {
											// Запись статуса ручного перемещения
											_this.moving = true;

											const _x = move.pageX || move.touches[0].pageX;
											const _y = move.pageY || move.touches[0].pageY;

											if (_this.vertical) {
												// Вертикальная бегущая строка

												// Инициализация буфера местоположения
												const from =
													_this.#shell.firstElementChild.style.marginTop;
												const to = _y - (y + offset - first.offset);

												// Движение
												_this.#shell.firstElementChild.style.marginTop = to +
													"px";
											} else {
												// Горизонтальная бегущая строка

												// Инициализация буфера местоположения
												const from =
													_this.#shell.firstElementChild.style.marginLeft;
												const to = _x - (x + offset - first.offset);

												// Движение
												_this.#shell.firstElementChild.style.marginLeft = to +
													"px";
											}

											if (_this.events.get(move.type)) {
												// Запрошен вызов события: "перемещение" (мышью или касанием)

												// Вызов события: "перемещение" (мышью или касанием)
												document.dispatchEvent(
													new CustomEvent(
														`hotline.${_this.#id}.${move.type}`,
														{
															detail: { from, to },
														},
													),
												);
											}

											// Запись курсора
											_this.#shell.style.cursor = "grabbing";
										}
									};

									// Запуск обработки движения
									document.addEventListener("mousemove", move);
									document.addEventListener("touchmove", move);
								}
							};

					// Перещапись событий браузера (чтобы не дёргалось)
					_this.#shell.ondragstart = null;

					_this.#shell.onmouseup = _this.#shell.ontouchend = function () {
						// Курсор деактивирован

						// Запись статуса ручного перемещения
						_this.moving = false;

						// Остановка обработки движения
						document.removeEventListener("mousemove", move);
						document.removeEventListener("touchmove", move);

						// Сброс сдвига
						offset = 0;

						document.removeEventListener(
							`hotline.${_this.#id}.transfer.start`,
							listener,
						);
						document.removeEventListener(
							`hotline.${_this.#id}.transfer.end`,
							listener,
						);

						// Разблокировка движения
						_this.#move = true;

						if (_this.events.get("move.unblock")) {
							// Запрошен вызов события: "разблокировка движения"

							// Вызов события: "разблокировка движения"
							document.dispatchEvent(
								new CustomEvent(`hotline.${_this.#id}.move.unblock`),
							);
						}

						// Восстановление курсора
						_this.#shell.style.cursor = null;
					};
				}

				// Инициализация обработчика отведения курсора (остановка движения)
				this.#shell.onmouseleave = function (onmouseleave) {
					// Курсор отведён от бегущей строки

					if (!_this.sticky) {
						// Отключено прилипание

						// Запись статуса ручного перемещения
						_this.moving = false;

						// Остановка обработки движения
						document.removeEventListener("mousemove", move);
						document.removeEventListener("touchmove", move);

						document.removeEventListener(
							`hotline.${_this.#id}.transfer.start`,
							listener,
						);
						document.removeEventListener(
							`hotline.${_this.#id}.transfer.end`,
							listener,
						);

						// Восстановление курсора
						_this.#shell.style.cursor = null;
					}

					// Сброс сдвига
					offset = 0;

					// Разблокировка движения
					_this.#move = true;

					if (_this.events.get("move.unblock")) {
						// Запрошен вызов события: "разблокировка движения"

						// Вызов события: "разблокировка движения"
						document.dispatchEvent(
							new CustomEvent(`hotline.${_this.#id}.move.unblock`),
						);
					}
				};
			}

			if (this.wheel) {
				// Запрошена возможность прокручивать колесом мыши

				// Инициализация обработчика наведения курсора (остановка движения)
				this.#shell.onwheel = function (e) {
					// Курсор наведён на бегущую

					// Инициализация буфера для временных данных
					let buffer;

					// Перемещение
					_this.offset(
						(isNaN(
								buffer = parseFloat(
									_this.#shell.firstElementChild.style[
										_this.vertical ? "marginTop" : "marginLeft"
									],
								),
							)
							? 0
							: buffer) +
							(_this.delta === null
								? e.wheelDelta
								: e.wheelDelta > 0
								? _this.delta
								: -_this.delta),
					);
				};
			}

			this.#status = "active";
		}

		if (this.observe) {
			// Запрошено наблюдение за изменениями аттрибутов элемента бегущей строки

			if (this.#observer === null) {
				// Отсутствует наблюдатель

				// Инициализация ссылки на ядро
				const _this = this;

				// Инициализация наблюдателя
				this.#observer = new MutationObserver(function (mutations) {
					for (const mutation of mutations) {
						if (mutation.type === "attributes") {
							// Запись параметра в инстанцию бегущей строки
							_this.configure(mutation.attributeName);
						}
					}

					// Перезапуск бегущей строки
					_this.restart();
				});

				// Активация наблюдения
				this.#observer.observe(this.#shell, {
					attributes: true,
				});
			}
		} else if (this.#observer instanceof MutationObserver) {
			// Запрошено отключение наблюдения

			// Деактивация наблюдения
			this.#observer.disconnect();

			// Удаление наблюдателя
			this.#observer = null;
		}

		if (this.events.get("start")) {
			// Запрошен вызов события: "запуск"

			// Вызов события: "запуск"
			document.dispatchEvent(
				new CustomEvent(`hotline.${this.#id}.start`),
			);
		}

		return this;
	}

	stop() {
		this.#status = "inactive";

		// Остановка бегущей строки
		clearInterval(this.#instance);

		// Удаление инстанции интервала
		this.#instance = null;

		if (this.events.get("stop")) {
			// Запрошен вызов события: "остановка"

			// Вызов события: "остановка"
			document.dispatchEvent(new CustomEvent(`hotline.${this.#id}.stop`));
		}

		return this;
	}

	restart() {
		// Остановка бегущей строки
		this.stop();

		// Запуск бегущей строки
		this.start();
	}

	configure(attribute) {
		// Инициализация названия параметра
		const parameter = (/^data-hotline-(\w+)$/.exec(attribute) ?? [, null])[1];

		if (typeof parameter === "string") {
			// Параметр найден

			// Проверка на разрешение изменения
			if (this.#block.has(parameter)) return;

			// Инициализация значения параметра
			const value = this.#shell.getAttribute(attribute);

			if (typeof value !== undefined || typeof value !== null) {
				// Найдено значение

				// Инициализация буфера для временных данных
				let buffer;

				// Запись параметра
				this[parameter] = isNaN(buffer = parseFloat(value))
					? value === "true" ? true : value === "false" ? false : value
					: buffer;
			}
		}

		return this;
	}

	offset(value) {
		// Запись отступа
		this.#shell.firstElementChild.style[
			this.vertical ? "marginTop" : "marginLeft"
		] = value + "px";

		if (this.events.get("offset")) {
			// Запрошен вызов события: "сдвиг"

			// Вызов события: "сдвиг"
			document.dispatchEvent(
				new CustomEvent(`hotline.${this.#id}.offset`, {
					detail: {
						to: value,
					},
				}),
			);
		}

		return this;
	}

	static preprocessing(event = false) {
		// Инициализация счётчиков инстанций горячей строки
		const success = new Set();
		let error = 0;

		for (
			const element of document.querySelectorAll('*[data-hotline="true"]')
		) {
			// Перебор элементов для инициализации бегущих строк

			if (typeof element.id === "string") {
				// Найден идентификатор

				// Инициализация инстанции бегущей строки
				const hotline = new this(element.id, element);

				for (const attribute of element.getAttributeNames()) {
					// Перебор аттрибутов

					// Запись параметра в инстанцию бегущей строки
					hotline.configure(attribute);
				}

				// Запуск бегущей строки
				hotline.start();

				// Запись инстанции бегущей строки в элемент
				element.hotline = hotline;

				// Запись в счётчик успешных инициализаций
				success.add(hotline);
			} else ++error;
		}

		if (event) {
			// Запрошен вызов события: "предварительная подготовка"

			// Вызов события: "предварительная подготовка"
			document.dispatchEvent(
				new CustomEvent(`hotline.preprocessed`, {
					detail: {
						success,
						error,
					},
				}),
			);
		}
	}
}
