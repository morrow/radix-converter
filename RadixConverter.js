function RadixConverter(output_selector){
  var self = this;
  this.alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
  this.outputs = {};
  this.values = {};
  this.outputElement = document.querySelector(output_selector);
  this.initialize();
}

RadixConverter.prototype.initialize = function(){
  var self = this;
  // load bases list from bases input
  try {
    value = document.querySelector('#bases-input').value;
    if(value[value.length - 1] === ','){
      value = value.slice(0, value.length - 1);
    }
    this.bases = JSON.parse('[' + value + ']');
    this.bases.forEach(function(base, i){
      // filter bad inputs
      if(base < 2){
        self.bases[i] = 2;
      }
      if(base > 32){
        self.bases[i] = 32;
      }
    });
  } catch(e) {
    this.bases = [];
  }
  // get column count from column input
  this.column_count = document.querySelector('#columns-input').value;
  this.main_input_base = document.querySelector('#main-input-base').value;
  // display output
  this.createTables();
  // attach event listeners
  this.attachEventListeners();
  // calculate results
  this.calculateResults();
  // highlight current base
  self.highlightCurrent();
};

RadixConverter.prototype.displayOutput = function(){
  var self = this;
  // updateRows - updates rows matching query with values
  function updateRows(query, values){
    [].forEach.call(document.querySelectorAll(query), function(row){
      [].forEach.call(row.querySelectorAll('input'), function(input, i){
        input.setAttribute('value', values[i]);
      });
    });
  };
  // display output for each base
  self.bases.forEach(function(base){
    // update rows with values and output
    updateRows('[data-base="' + base + '"] tr.input', self.values[base]);
    updateRows('[data-base="' + base + '"] tr.output', self.outputs[base]);
    document.querySelector('#base-' + base + '-result input').value = self.values[base].trim();
  });
};

RadixConverter.prototype.attachEventListeners = function(){
  var self = this;
  // main input
  document.querySelector('#main-input').oninput = function(e){
    if(this.value == '' || this.value.match(new RegExp(this.pattern, 'g')) && this.value.length == this.value.match(new RegExp(this.pattern, 'g')).length){
      this.style.borderColor = '';
      if(this.value != '' && document.querySelector('#auto-columns').checked){
        document.querySelector('#columns-input').value = Math.max(5, parseInt(this.value, self.main_input_base).toString(self.bases.sort().reverse()[0]).length);
        document.querySelector('#columns-input').oninput();
      }
      self.calculateResults();
    } else {
      this.style.borderColor = 'red';
    }
  };
  // listen for input on output text boxes
  self.bases.forEach(function(base){
    document.querySelector('#base-' + base + '-result input').oninput = function(e){
      document.querySelector('#main-input').value = parseInt(this.value, base);
      s_start = this.selectionStart;
      s_end = this.selectionEnd;
      document.querySelector('#main-input').oninput();
      this.selectionStart = s_start;
      this.selectionEnd = s_end;
    };
  });

  document.querySelector('#bases-input').oninput = function(){
    self.initialize();
  };

  document.querySelector('#columns-input').oninput = function(){
    self.initialize();
  };

  document.querySelector('#main-input-base').oninput = function(){
    self.main_input_base = this.value;
    if(self.main_input_base < 11){
      var pattern = '[0-' + (self.main_input_base - 1) + ']';
    } else {
      var pattern = '[0-9]|[a-' + self.alphabet[self.main_input_base - 11] + ']';
    }
    document.querySelector('#main-input').setAttribute('pattern', pattern);
    document.querySelector('#main-input').oninput();
    self.highlightCurrent();
  };
};

RadixConverter.prototype.highlightCurrent = function(){
  [].forEach.call(document.querySelectorAll('main > section'), function(section){
    section.className = section.className.replace(' current', '');
    if(section.className.split('base-')[1] == document.querySelector('#main-input-base').value.toString()){
      section.className += ' current';
    }
  });
};


RadixConverter.prototype.calculateResults = function(){
  var self = this;
  var input_value = document.querySelector('#main-input').value;
  var input_base = parseInt(document.querySelector('#main-input-base').value);
  if(!input_value.match(/\w/)){ return false; }
  var value = parseInt(input_value, input_base).toFixed(0);
  if(isNaN(value)){ return false; }
  self.bases.forEach(function(base){
    // parse values from input value
    self.values[base] = parseInt(value).toString(base);
    // pad beginning of values to account for number < column count
    while(self.values[base].length < self.column_count){
      self.values[base] = ' ' + self.values[base];
    }
    // calculate outputs
    self.outputs[base] = self.values[base].split('').map(function(_x, i){
      if(_x === ' '){ return ' '; }
      var x = _x
      if(isNaN(_x) && _x.toString().match(/[a-z]/i)){
        x = [self.alphabet].indexOf(_x) + 10;
      }
      return x * Math.pow(base, self.column_count - i - 1)
    });
  });
  this.displayOutput();
};

RadixConverter.prototype.createTables = function(){
  var self = this;
  // clear existing html in output element
  self.outputElement.innerHTML = '';
  this.bases.forEach(function(base){
    var section = document.createElement('section');
    section.className = 'base-' + base;
    var h2 = document.createElement('h2');
    h2.innerText = 'Base ' + base;
    section.appendChild(h2);
    var table = document.createElement('table');
    table.setAttribute('data-base', base);
    section.style.width =  self.column_count * 75 + 'px';
    // create rows
    var tr_multiplier = document.createElement('tr');
    tr_multiplier.className = 'multiplier';
    var tr_input = document.createElement('tr');
    tr_input.className = 'input';
    var tr_equals = document.createElement('tr');
    tr_equals.className = 'equals';
    var tr_output = document.createElement('tr');
    tr_output.className = 'output';
    // createTd
    function createTd(html){
      var td = document.createElement('td');
      td.innerHTML = html;
      return td;
    }
    // add tds to rows
    for(var i = 0; i < self.column_count; i++){
      tr_multiplier.appendChild(createTd('' + base + '<sup>' + ((self.column_count - 1) - i) + '</sup><div>×</div>'));
      if(i > 0){
        tr_input.appendChild(createTd('<span style="opacity:0">+</span><input type="text" />'));
      } else {
        tr_input.appendChild(createTd('<input type="text" />'));
      }
      tr_equals.appendChild(createTd('='));
      if(i > 0){
        tr_output.appendChild(createTd('<span style="opacity:1">+</span><input type="text" />'));
      }
      else {
        tr_output.appendChild(createTd('<input type="text" />'));
      }
    }
    table.appendChild(tr_multiplier);
    table.appendChild(tr_input);
    table.appendChild(tr_equals);
    table.appendChild(tr_output);
    section.appendChild(table);
    var result = document.createElement('div');
    result.id = 'base-' + base + '-result';
    result.className = 'result';
    result.innerHTML = "=<input type='text' />";
    section.appendChild(result);
    self.outputElement.appendChild(section);
  });
}
