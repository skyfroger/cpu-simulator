// example = "55 16 37 92 00 30 01 00 00 00 00 00 00 00 00 00";
var cpu = {
	
	step: function() {
		function setState(nextState, stageName, description) {
			
			description = description.replace(/\*(.*?)\*/g, function(match, contents) {
				return '<span class="hint_name">' + contents + '</span>';
			});
			cpu.showHint('<span class="fetch_decode_execute ' + stageName.toLowerCase() + '">' + stageName + '</span>' + description);
			cpu.state = nextState;
		}
		switch(cpu.state) {
			
			case 0:
				setState(1, "Выборка", "*Блок управления (CU)* копирует значение из *Счётчика команд (PC)* в *Регистр адреса памяти (MAR)* и в *Адресную шину*");
				cpu.registers.mar = cpu.registers.pc;
				cpu.updateValues();
				$('.active').removeClass('active');
				$('#reg_pc,#reg_mar').addClass('active');
				$('.current_instruction').removeClass('current_instruction');
				$('#ram_address_' + cpu.registers.pc).addClass('current_instruction');
				break;
			case 1:
				setState(2, "Выборка", "*Блок управления (CU)* сообщает оперативной памяти о необходимости найти адрес, который хранится в *Адресной шине* и загрузить значение хранящееся в ячейке с этим адресом в *Шину данных*");
				$('.active').removeClass('active');
				$('#ram_value_' + cpu.registers.mar).addClass('active');
			break;
			
			case 2:
				setState(3, "Выборка", "*Блок управления (CU)* сохраняет значение которое хранится в *Шине данных* в *Регистре данных (MDR)*");
				cpu.registers.mdr = cpu.ram[cpu.registers.mar];
				cpu.updateValues();
				$('.active').removeClass('active');
				$('#reg_mdr').addClass('active');
				break;
				
			case 3:
				setState(4, "Выборка", "*Блок управления (CU)* копирует значение из *Регистра данных (MDR)* в *Регистр текущей операции (CIR)*");
				cpu.registers.cir = cpu.registers.mdr;
				cpu.updateValues();
				$('.active').removeClass('active');
				$('#reg_mdr,#reg_cir').addClass('active');
				break;
			
			case 4:
				setState(5,"Выборка", "*Блок управления (CU)* увеличивает на единицу значение *Счетчика команд (PC)*");
				cpu.registers.pc++;
				cpu.updateValues();
				$('.active').removeClass('active');
				$('#reg_pc').addClass('active');
				break;
			
			
			case 5:
				setState(6, "Декодирование", "*Блок декодирования* разбивает значение в *Регистре текущей операции (CIR)* на *код операции (opcode)* и *операнд (operand)*."); 
				$('.active').removeClass('active');
				$('#reg_cir,.decode_unit table').addClass('active');
				break;
				
			case 6:
				var opcode = ((cpu.registers.cir & 0xff) >> 4);
				$('.active').removeClass('active');
				$('.decode_row_' + opcode).addClass('active');
				switch(opcode) {
					case 0:
						setState(7, "Декодирование", "*Код операции (opcode)* 0000 означает завершение работы программы");
					break;
					
					case 1:
						setState(8, "Декодирование", "*Код операции (opcode)* 0001 означает прибавление значения хранящегося в регистре-*Аккумуляторе (ACC)* к значению, которое хранится в памяти по адресу указанному в *операнде (operand)*");
					break;
					
					case 2:
						setState(9, "Декодирование", "*Код операции (opcode)* 0010 означает вычитание значения, хранящегося в памяти по адресу указанному в *операнде (operand)* из значения хранящегося в регистре-*Аккумуляторе (ACC)* register");
					break;
					
					case 3:
						setState(10, "Декодирование", "*Код операции (opcode)* 0011 означает сохранение значения которое хранится в регистре-*Аккумуляторе (ACC)* в ячейку памяти с адресом, указанным в *операнде (operand)*");
					break;
					
					case 5:
						setState(11, "Декодирование", "*Код операции (opcode)* 0101 означает загрузку значения хранящегося в памяти (адрес указывается в *операнде (operand)*) в регистр-*Аккумулятор (ACC)*");
					break;
					
					case 6:
						setState(12, "Декодирование", "*Код операции (opcode)* 0110 означает безусловный переход к указанному адресу в памяти");
					break;
					
					case 7:
						setState(13, "Декодирование", "*Код операции (opcode)* 0111 означает условный переход к указанному адресу в памяти в случае, если в регистре-*Аккумуляторе (ACC)* хранится значение равное нулю");
					break;
					
					case 8:
						setState(14, "Декодирование", "*Код операции (opcode)* 1000 означает условный переход к указанному адресу в памяти в случае, если регистр-*Аккумулятор (ACC)* хранит значение большее или равное нулю (не отрицательное число)");
					break;
					
					case 9:
						setState(15, "Декодирование", "*Код операции (opcode)* 1001 означает ввод или вывод, в зависимости от значения *операнда (operand)*");
					break;
					
					
				}
				break;
			
			case 7:
				setState(7, "Выполнение", "Работа процессора (CPU) приостановлена и *Блок управления (CU)* больше не делает выборку новых команд");
				$('.active').removeClass('active');
				cpu.running = false;
				break;
				
			case 8: //The *код операции (opcode)* 0001 means add the value in the *Аккумулятор (ACC)* register to the data stored in memory at the address specified by the *операнд (operand)*"
				setState(81, "Декодирование", "*Блок декодирования* отправляет *код операции (opcode)* в *Регистр адреса памяти (MAR)* который также копируется в *Адресную шину*");
				cpu.registers.mar = cpu.registers.cir & 0x0F;
				cpu.updateValues();
				$('.active').removeClass('active');
				$('#reg_mar,.decode_row_1').addClass('active');
			break;
			
			case 81: 
				setState(82, "Выполнение", "*Блок управления (CU)* сообщает оперативной памяти найти адрес указанный в *Адресной шине* и скопировать значение из ячейки с этим адресом в *Шину данных*");
				$('.active').removeClass('active');
				$('#ram_value_' + cpu.registers.mar).addClass('active');
				break;
			case 82:
				setState(83, "Выполнение", "*Блок управления (CU)* копирует значение из *Шины данных* в *Регистр данных (MDR)*");
				cpu.registers.mdr = cpu.ram[cpu.registers.mar];
				cpu.updateValues();
				$('.active').removeClass('active');
				$('#reg_mdr').addClass('active');
				break;
			case 83:
				setState(0, "Выполнение", "*Код операции (opcode)* и *Блок управления (CU)* сигнализируют *Арифметико-логическому устройству (ALU)* прибавить значение хранящееся в регистре-*Аккумуляторе (ACC)* к значениею в *Регистре данных (MDR)*. Результат сложения сохраняется в регистре-*Аккумуляторе (ACC)*.");
				cpu.registers.acc += cpu.registers.mdr;
				cpu.updateValues();
				$('.active').removeClass('active');
				$('#reg_mdr,#alu,#acc').addClass('active');
			break;
			
			
			case 9: //"The *код операции (opcode)* 0010 means subtract the value stored in memory at the address specified by the *операнд (operand)* from the value in the *Аккумулятор (ACC)* register"
				setState(91, "Декодирование", "*Блок декодирования* отправляет *код операции (opcode)* в *Регистр адреса памяти (MAR)* значение которого также копируется в *Адресную шину*");
				cpu.registers.mar = cpu.registers.cir & 0x0F;
				cpu.updateValues();
				$('.active').removeClass('active');
				$('#reg_mar').addClass('active');
			break;
			
			case 91: 
				setState(92, "Выполнение", "*Блок управления (CU)* сообщает оперативной памяти найти адрес, который указан в *Адресной шине* и скопировать значение из ячейки с этим адресом в *Шину данных*");
				$('.active').removeClass('active');
				$('#ram_value_' + cpu.registers.mar).addClass('active');
				break;
			case 92:
				setState(93, "Выполнение", "*Блок управления (CU)* копирует значение которое хранится в *Шине данных* в *Регистр данных (MDR)*");
				$('.active').removeClass('active');
				$('#reg_mdr').addClass('active');
				cpu.registers.mdr = cpu.ram[cpu.registers.mar];
				cpu.updateValues();
				break;
			case 93:
				setState(0, "Выполнение", "*Код операции (opcode)* и *Блок управления (CU)* сигнализируют *Арифметико-логическому устройству (ALU)* вычесть значение, которое хранится в *Регистре данных (MDR)* из значения в регистре-*Аккумуляторе (ACC)*. Результат вычитания сохраняется в регистре-*Аккумуляторе (ACC)*.");
				cpu.registers.acc = cpu.registers.acc - cpu.registers.mdr;
				cpu.updateValues();
				$('.active').removeClass('active');
				$('#alu,#reg_acc,#reg_mdr').addClass('active');
			break;
			
			
			
			case 10: //"The *код операции (opcode)* 0011 means store the value in the *Аккумулятор (ACC)* register into memory at the address specified by the *операнд (operand)*"
				setState(101, "Декодирование", "*Код операции (opcode)* и *Блок управления (CU)* отправляют значение которое хранится в регистре-*Аккумуляторе (ACC)* в *Регистр данных (MDR)* и в *Шину данных*");
				cpu.registers.mdr = cpu.registers.acc;
				cpu.updateValues();
				$('.active').removeClass('active');
				$('#reg_acc,#reg_mdr').addClass('active');
				break;
			case 101:
				setState(102, "Декодирование", "*Блок декодирования* отправляет значение *операнда (operand)* в *Регистр адреса памяти (MAR)* и *Адресную шину*");
				cpu.registers.mar = cpu.registers.cir & 0x0F;
				cpu.updateValues();
				$('.active').removeClass('active');
				$('#reg_mar').addClass('active');
			break;
			case 102: 
				setState(0, "Выполнение", "*Блок управления (CU)* даёт команду оперативной памяти сохранить значение которое хранится в *Шине данных* по адресу который хранится в *Адресной шине*");
				cpu.ram[cpu.registers.mar] = cpu.registers.mdr;
				cpu.updateValues();
				$('.active').removeClass('active');
				$('#ram_value_' + cpu.registers.mar).addClass('active');
				break;
			
			case 11: //"The *код операции (opcode)* 0101 means load the value from memory (at the address specified by the *операнд (operand)*) into the *Аккумулятор (ACC)* register"
				setState(111, "Декодирование", "*Блок декодирования* отправляет значение *операнда (operand)* в *Регистр адреса памяти (MAR)* и *Адресную шину*");
				cpu.registers.mar = cpu.registers.cir & 0x0F;
				cpu.updateValues();
				$('.active').removeClass('active');
				$('#reg_mar').addClass('active');
			break;
			
			case 111: 
				setState(112, "Выполнение", "*Блок управления (CU)* дает команду оперативной памяти найти ячейку с адресом, который хранится в *Адресной шине* и скопировать значение, которое хранится в этой ячейке в *Шину данных*");
				$('.active').removeClass('active');
				$('#ram_value_' + cpu.registers.mar).addClass('active');
				break;
			case 112:
				setState(113, "Выполнение", "*Блок управления (CU)* копирует значение, которое хранится в *Шине данных* в *Регистр данных (MDR)*");
				cpu.registers.mdr = cpu.ram[cpu.registers.mar];
				cpu.updateValues();
				$('.active').removeClass('active');
				$('#reg_mdr').addClass('active');
				break;
			case 113:
				setState(20, "Выполнение", "*Код операции (opcode)* и *Блок управления (CU)* отправляют значение, которое хранится в *Регистре данных (MDR)* в регистр-*Аккумулятор (ACC)*");
				cpu.registers.acc = cpu.registers.mdr;
				cpu.updateValues();
				$('.active').removeClass('active');
				$('#reg_mdr,#reg_acc').addClass('active');
			break;
			
			case 12://The *код операции (opcode)* 0110 means branch (unconditionally)
				setState(20, "Выполнение", "*Операнд (operand)* сохраняется в *Счетчике команд (PC)*");
				cpu.registers.pc = cpu.registers.cir & 0x0F;
				cpu.updateValues();
				$('.active').removeClass('active');
				$('#reg_pc').addClass('active');
			break;
			
			case 13://The *код операции (opcode)* 0111 means branch if the *Аккумулятор (ACC)* stores a value equal to 0
				setState(20, "Выполнение", "*Блок управления (CU)* и *код операции (opcode)* дают команду *Арифметико-логическому устройству (ALU)* определить, равно ли число в регистре-*Аккумуляторе (ACC)* нулю. Если это так, то значение *операнда (operand)* копируется в регистр *Счетчика команд (PC)*");
				if(cpu.registers.acc == 0)
					cpu.registers.pc = cpu.registers.cir & 0x0F;
				cpu.updateValues();
				$('.active').removeClass('active');
				$('#reg_acc,#reg_pc,#alu').addClass('active');
			break;
			
			case 14://The *код операции (opcode)* 1000 means branch if the *Аккумулятор (ACC)* stores a value greater than or equal to 0"
				setState(20, "Выполнение", "*Блок управления (CU)* и *код операции (opcode)* дают команду *Арифметико-логическому устройству (ALU)* определить, хранит ли регистр-*Аккумулятор (ACC)* число большее или равное нулю. Если это так, то значение *операнда (operand)* копируется в регистр *Счетчика команд (PC)*");
				if(cpu.registers.acc >= 0)
					cpu.registers.pc = cpu.registers.cir & 0x0F;
				$('.active').removeClass('active');
				cpu.updateValues();
				$('#alu,#reg_acc,#reg_pc').addClass('active');
			break;
			
			case 15://The *код операции (opcode)* 1001 means either input or output, depending on the *операнд (operand)*"
				if((cpu.registers.cir & 0x0F) == 1) {
					setState(20, "Выполнение", "*Код операции (opcode)* 0001 и *Шина управления* считывают значение из устройства ввода и сохраняют введённое значение в регистре-*Аккумуляторе (ACC)*");
					cpu.registers.acc = parseInt(prompt("Введите число в десятичной системе счисления:")) & 0xFF;
					cpu.updateValues();
					$('.active').removeClass('active');
					$('#reg_acc').addClass('active');
				}
				if((cpu.registers.cir & 0x0F) == 2) {
					setState(20, "Выполнение", "*Код операции (opcode)* 0010 и *Шина управления* дают команду отправить значение, которое хранится в регистре-*Аккумуляторе (ACC)* на устройство вывода");
					alert("Вывод: " + cpu.registers.acc);
					$('.active').removeClass('active');
					$('#reg_acc').addClass('active');
				}
			break;

			case 20:
				setState(0, "Выполнение", "*Блок управления (CU)* проверяет наличие прерываний и, либо переходит к прерыванию, либо начинает цикл заново");
				break;
			
			
		}
		if(cpu.running) {
			cpu.nextTimeout = setTimeout(cpu.step, cpu.runDelay);
		}
	},
	
	state: 0,
	
	running: false,
	
	nextTimeout: 0,
	
	runDelay: 1000,
	
	showHint: function(html) {
		$('#hint_text').html(html);
	},
	
	jqCPU: null,
	
	ram: [],
	
	pad: function(val, length) {
		while(val.length < length) {
			val = "0" + val;
		}
		return val;
	},
	
	hex2bin: function(hex) {
		var v = parseInt(hex, 16) & 0xFF;
		return cpu.pad(v.toString(2), 8);
	},
	
	bin2hex: function(bin) {
		var v = parseInt(bin, 2) & 0xFF;
		return cpu.pad(v.toString(16), 2);
	},
	
	bin2dec: function(bin) {
		var v = parseInt(bin, 2) & 0xFF;
		if(v >= 128)
			v -= 256;
		return v;
	},
	
	dec2bin: function(dec) {
		return cpu.pad((dec & 0xFF).toString(2), 8);
	},
	
	hex2dec: function(hex) {
		var v = parseInt(hex, 16) & 0xFF;
		if(v >= 128)
			v -= 256;
		return v;
	},
	
	dec2hex: function(dec) {
		return cpu.pad((dec & 0xFF).toString(16), 2);
	},
	
	updateValues: function() {
		var regNames = Object.keys(cpu.registers);
		
		function writeValue(val, jqDest) {
			if(jqDest.hasClass("value_binary")) {
				val = cpu.dec2bin(val);
			}
			if(jqDest.hasClass("value_hex")) {
				val = cpu.dec2hex(val);
			}
			jqDest.text(val);
		}
		
		for(var i = 0; i < regNames.length; i++) {
			var val = cpu.registers[regNames[i]];
			var jqDest = $('#reg_' + regNames[i] + "_val");
			writeValue(val, jqDest);
		}
		
		for(var i = 0; i < cpu.ram.length; i++) {
			writeValue(cpu.ram[i], $('#ram_value_' + i));
		}
	},
	
	registers: {
		acc: 0,
		pc: 0,
		mar: 0,
		mdr: 0,
		cir: 0
	},
	
	updateAnnotations: function() {
		var d = $('#drawing').html("");
		var w = d.width();
		var h = d.height();
		var paper = Raphael("drawing", w, h);
		paper.clear();

		function connect(from, to, attributes, label, labelAttributes) {

			function getX(i, a) {
				switch(a){
					case 'left':
						return i.position().left;
					break;
					case 'right':
						return i.position().left + i.outerWidth(true);
					break;
					case 'middle':
						return i.position().left + (i.outerWidth(true) / 2);
					break;
					default:
						var percentage = parseInt(a.replace("%", ""));
						return i.position().left + (i.outerWidth(true) * percentage / 100);
					break;
				}
			}
			
			function getY(i, a) {
				switch(a) {
					case 'top':
						return i.position().top;
					break;
					case 'bottom':
						return i.position().top + i.outerHeight(true);
					break;
					case 'middle':
						return i.position().top + (i.outerHeight(true) / 2);
					break;
					default:
						var percentage = parseInt(a.replace("%", ""));
						return i.position().top + (i.outerHeight(true) * percentage / 100);
				}
			}
			var x1 = getX(from.e, from.h);
			var x2 = x1;
			if(to.h) {
				x2 = getX(to.e, to.h);
			}
			
			var y1 = getY(from.e, from.v);
			var y2 = y1;
			if(to.v) {
				y2 = getY(to.e, to.v);
			}
			
			var e = paper.path("M" + Math.floor(x1) + " " + Math.floor(y1) + "L" +  Math.floor(x2) + " " + Math.floor(y2));
			if(attributes === undefined) {
				attributes = {"stroke-width": 10, "arrow-end":"block-narrow-short"};
			}
			e.attr(attributes);
			
			if(label) {
				var x = Math.floor((x1 + x2) / 2);
				var y = Math.floor((y1 + y2) / 2);
				var text = paper.text(x, y, label);
				if(labelAttributes) {
					text.attr(labelAttributes);
				}
			}
		}
		
		var PC = $('#reg_pc');
		var MAR = $('#reg_mar');
		var decodeUnit = $('.decode_unit');
		var MDR = $('#reg_mdr');
		var CIR = $('#reg_cir');
		var ALU = $('#alu');
		var ACC = $('#reg_acc');
		var CPU = $('.cpu');
		var RAM = $('.ram');
		
		connect({e:ALU, h:"left", v:"middle"}, {e:decodeUnit, h:"right"}, {"stroke-width": 10, "arrow-start":"block-narrow-short"});
		connect({e:PC, h:"right", v:"middle"}, {e:MAR, h:"left", v:"middle"});
		connect({e:decodeUnit, h:"60%", v:"top"}, {e:PC, v:"bottom"});
		connect({e:decodeUnit, h:"80%", v:"top"}, {e:MAR, h:"left", v:"bottom"});
		connect({e:MDR, h:"middle", v:"bottom"}, {e:CIR, h:"middle", v:"top"});
		connect({e:CIR, h:"left", v:"middle"}, {e:decodeUnit, h:"right"});
		connect({e:MDR, h:"20%", v:"top"}, {e:ALU, v:"bottom"});
		connect({e:ACC, h:"20%", v:"bottom"}, {e:ALU, v:"top"}, {"stroke-width": 10, "arrow-end":"block-narrow-short", "arrow-start": "block-narrow-short"});
		connect({e:MDR, h:"80%", v:"top"}, {e:ACC, h:"80%", v:"bottom"}, {"stroke-width": 10, "arrow-end":"block-narrow-short", "arrow-start": "block-narrow-short"});
		
		connect({e:CPU, h:"right", v:"5%"}, {e: RAM, h:"left"}, {"stroke-width": 20, "stroke": "#8F002E", "arrow-end":"block-narrow-short"}, "Адресная шина", {fill: '#fff', font: '15px Arial'});
		connect({e:CPU, h:"right", v:"56%"}, {e: RAM, h:"left"}, {"stroke-width": 20, "stroke": "#8F002E", "arrow-end":"block-narrow-short", "arrow-start": "block-narrow-short"}, "Шина данных", {fill: '#fff', font: '15px Arial'});
		connect({e:CPU, h:"right", v:"85%"}, {e: RAM, h:"left"}, {"stroke-width": 20, "stroke": "#8F002E", "arrow-end":"block-narrow-short", "arrow-start": "block-narrow-short"}, "Шина управления", {fill: '#fff', font: '15px Arial'});
	},
	
	init: function(jqCPU) {
		$(window).resize(cpu.updateAnnotations);
		cpu.jqCPU = jqCPU;
		var html ='<div id="drawing"></div><div class="ram"><h3><i class="fa fa-list"></i> RAM</h3>';
		html += '<table class="table table-fixed table-striped table-hover"><thead><tr><th>Адрес</th><th>Значение</th></tr></thead>';
		var params = window.location.search.substr(1);
		var ram = [];
		var initZeros = true;
		if(ram = params.replace("ram=", "")) {
			if(ram = ram.match(/([0-9a-fA-F]{2})/g)) {
				initZeros = false;
			}
		}
		for(var address = 0; address < 16; address++) {
			cpu.ram[address] = initZeros? 0 : cpu.hex2dec(ram[address]);
			html += '<tr><td id="ram_address_' + address + '" class="value value_denary">' + address + '</td><td id="ram_value_' + address + '" class="value value_denary editable" data-description="Адрес ' + address + '">' + cpu.ram[address] + '</td></tr>';
		}
		html += '</table>';
		html += '</div>';
		
		
		html += '<div class="cpu"><h3><i class="fa fa-microchip"></i> CPU</h3>';
		
		function getRegisterHtml(name, value, desc) {
			return '<div class="register" id="reg_' + name.toLowerCase()+'"><div class="reg_name">' + name + '</div><div id="reg_' + name.toLowerCase() + '_val" class="reg_val value value_denary editable" data-description="' + desc + '">' + value + '</div></div>';
		}
		html += getRegisterHtml('PC', 0, "Счетчик команд (PC)");
		html += getRegisterHtml('MAR', 0, "Регистр адреса памяти (MAR)");
		html += getRegisterHtml('MDR', 0, "Регистр данных (MDR)");
		html += getRegisterHtml('ACC', 0, "Аккумулятор (ACC)");
		html += getRegisterHtml('CIR', 0, "Регистр текущей операции (CIR)");
		
		html += '<div id="alu">АЛУ</div>';
		html += '<div id="cu">Блок управления (CU)</div>';
		
		
		html += '<div class="decode_unit"><h4><i class="fa fa-info-circle"></i> Блок декодирования</h2>';
		html += '<table class="table table-fixed table-striped table-hover"><thead><tr><th>Opcode</th><th>Операнд</th><th>Инструкция</th></tr></thead>';
		html += '<tr class="decode_row_0"><td>0000</td><td>0000</td><td>Конец программы</td></tr>';
		html += '<tr class="decode_row_1"><td>0001</td><td>адрес</td><td>Сложить</td></tr>';
		html += '<tr class="decode_row_2"><td>0010</td><td>адрес</td><td>Вычесть</td></tr>';
		html += '<tr class="decode_row_3"><td>0011</td><td>адрес</td><td>Сохранить</td></tr>';
		html += '<tr class="decode_row_5"><td>0101</td><td>адрес</td><td>Загрузить</td></tr>';
		html += '<tr class="decode_row_6"><td>0110</td><td>адрес</td><td>Бузусловный переход</td></tr>';
		html += '<tr class="decode_row_7"><td>0111</td><td>адрес</td><td>Ветвление, если ACC = 0</td></tr>';
		html += '<tr class="decode_row_8"><td>1000</td><td>адрес</td><td>Ветвление, если ACC >= 0</td></tr>';
		html += '<tr class="decode_row_9"><td>1001</td><td>0001</td><td>Ввод</td></tr>';
		html += '<tr class="decode_row_9"><td>1001</td><td>0010</td><td>Вывод</td></tr>';
		html += '</div>';
		
		html += '</div>';
		
		
		
		$(jqCPU).html(html);
		
		
		cpu.updateAnnotations();
		
		$('#modal_change_value').modal({ show: false})
		$('#run_speed').change(function() {
			cpu.runDelay = $(this).val();
		});
		
		$('#btn_reset_cpu').click(function() {
			cpu.state = 0;
			cpu.registers.acc = cpu.registers.cir = cpu.registers.mar = cpu.registers.mdr = cpu.registers.pc = 0;
			cpu.showHint("Регистры процессора и его состояние сброшены")
			$('.current_instruction').removeClass('current_instruction');
			cpu.updateValues();
		});
		
		$('#btn_share').click(function() {
			$('#st-2').toggleClass('st-hidden');
		});
		
		setTimeout(function() {
			$('#st-2').addClass('st-hidden');
		}, 5000);
		
		$('#btn_reset_ram').click(function() {
			cpu.showHint("Все ячейки оперативной памяти инициализированы значением 0");
			for(var address = 0; address < 16; address++) {
				cpu.ram[address] = 0;
				var jq = $('#ram_value_' + address);
				if(jq.hasClass('value_denary')) {
					jq.text(0);
				}
				if(jq.hasClass('value_binary')) {
					jq.text("00000000");
				}
				if(jq.hasClass('value_hex')) {
					jq.text("00");
				}
			}
		});
		
		$('.value.editable').click(function(e) {
			var id = e.currentTarget.id;
			
			var jq = $('#' + id);
			$('#modal_change_value_title').text(jq.data("description"));
			$('#change_value_from').text(jq.text());
			$('#change_value_to').val(jq.text());
			cpu.lastChangedValue = id;
			$('#modal_change_value').modal('show')
		});
		
		$('#btn_change_value_ok').click(function() {
			function getInt(jq, val) {
				if(jq.hasClass('value_hex')) {
					return cpu.hex2dec(val);
				}
				if(jq.hasClass('value_binary')) {
					return cpu.bin2dec(val);
				}
				val = parseInt(val, 10) & 0xFF;
				return val >= 128? val - 256: val;
			}
			
			var jq = $('#' + cpu.lastChangedValue);
			var value = $('#change_value_to').val();
			var parts = cpu.lastChangedValue.split("_");
			switch(parts[0]) {
				case 'ram':
					var address = parseInt(parts[2]);
					cpu.ram[address] = getInt(jq, value);
				break;
				case 'reg':
					var reg = parts[1];
					cpu.registers[reg] = getInt(jq, value);
				break;
				
			}
			cpu.updateValues();
		});
		
		$('#btn_step').click(cpu.step);
		
		$('#btn_run').click(function() {
			if(cpu.running && cpu.nextTimeout) {
				clearTimeout(cpu.nextTimeout);
			} else {
				cpu.running = true;
				cpu.step();
			}
		});
		
		$('#modal_change_value').on('shown.bs.modal', function() {
			$('#change_value_to').focus().select();
		});
		
		$('#modal_export').on('shown.bs.modal', function(e) {
			var bytes = [];
			for(var i = 0; i < cpu.ram.length; i++) {
				bytes.push(cpu.dec2hex(cpu.ram[i]));
			}
			var hex = bytes.join(" ");
			$('#export_hex').val(hex).focus().select();
		});
		
		$('#btn_import').click(function() {
			var bytes = $('#export_hex').val().split(" ");
			for(var i = 0; i < bytes.length && i < cpu.ram.length; i++) {
				cpu.ram[i] = cpu.hex2dec(bytes[i]);
			}
			cpu.updateValues();
		});
		
		$('#btn_export').click(function() {
			var bytes = $('#export_hex').val().replace(/ /g, "");
			window.location = window.location.origin + window.location.pathname + "?ram=" + bytes;
		});
		
		$('#btn_toggle_hint').click(function(e) {
			$('#hint').toggleClass('hint-hidden');
		});
		
		$('.btn_values').click(function(e) {
			var mode = e.currentTarget.id.split("_")[2];
			$('.value').each(function(index, element) {
				var jq = $(this);
				var val = jq.text();
				if(jq.hasClass("value_binary")) {
					val = parseInt(val, 2);
				}
				if(jq.hasClass("value_denary")) {
					val = parseInt(val, 10);
				}
				if(jq.hasClass("value_hex")) {
					val = parseInt(val, 16);
				}
				switch(mode) {
					case 'binary':
						jq.text(cpu.dec2bin(val));
						break
					case 'hex':
						jq.text(cpu.dec2hex(val));
						break;
					case 'denary':
						jq.text(val);
				}
			}).removeClass("value_binary value_denary value_hex").addClass("value_" + mode);
			
		});
		
		$('#btn_values_binary').trigger("click");
	}
};
$(function() {
	cpu.init("#cpu")
});