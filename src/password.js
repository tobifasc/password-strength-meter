/**
 * @author Òscar Casajuana a.k.a. elboletaire <elboletaire at underave dot net>
 * @link https://github.com/elboletaire/password-strength-meter
 * @license GPL-3.0
 */
// eslint-disable-next-line
;(function($) {
  'use strict';

  var Password = function ($object, options) {
    var defaults = {
      shortPass: 'The password is too short',
      badPass: 'Weak; try combining letters & numbers',
      goodPass: 'Medium; try using special characters',
      strongPass: 'Strong password',
      containsField: 'The password contains your username',
      enterPass: 'Type your password',
      noDigit: 'A digit is required',
      noUpperLetter: 'An uppercase letter is required',
      noLowerLetter: 'A lowercase letter is required',
      showPercent: false,
      showText: true,
      animate: true,
      animateSpeed: 'fast',
      field: false,
      fieldPartialMatch: true,
      minimumLength: 4,
      closestSelector: 'div',
      requiresDigit: false,
      requiresUpperLetter: false,
      requiresLowerLetter: false
    };

    options = $.extend({}, defaults, options);

    /**
     * Returns strings based on the score given.
     *
     * @param int score Score base.
     * @return string
     */
    function scoreText(score) {
      if (score === -1) {
        return options.shortPass;
      }
      if (score === -2) {
        return options.containsField;
      }
      if (score === -3) {
        return options.noDigit;
      }
      if (score === -4) {
        return options.noUpperLetter;
      }
      if (score === -5) {
        return options.noLowerLetter;
      }

      score = score < 0 ? 0 : score;

      if (score < 34) {
        return options.badPass;
      }
      if (score < 68) {
        return options.goodPass;
      }

      return options.strongPass;
    }

    /**
     * Returns a value between -2 and 100 to score
     * the user's password.
     *
     * @param  string password The password to be checked.
     * @param  string field The field set (if options.field).
     * @return int
     */
    function calculateScore(password, field) {
      var score = 0;

      // password < options.minimumLength
      if (password.length < options.minimumLength) {
        return -1;
      }

      if (options.field) {
        // password === field
        if (password.toLowerCase() === field.toLowerCase()) {
          return -2;
        }
        // password contains field (and fieldPartialMatch is set to true)
        if (options.fieldPartialMatch && field.length) {
          var user = new RegExp(field.toLowerCase());
          if (password.toLowerCase().match(user)) {
            return -2;
          }
        }
      }

      if (options.requiresDigit && !password.match(/[0-9]/)) {
        return -3;
      }

      if (options.requiresUpperLetter && !password.match(/[A-Z]/)) {
        return -4;
      }

      if (options.requiresLowerLetter && !password.match(/[a-z]/)) {
        return -5;
      }

      // password length
      score += password.length * 4;
      score += checkRepetition(1, password).length - password.length;
      score += checkRepetition(2, password).length - password.length;
      score += checkRepetition(3, password).length - password.length;
      score += checkRepetition(4, password).length - password.length;

      // password has 3 numbers
      if (password.match(/(.*[0-9].*[0-9].*[0-9])/)) {
        score += 5;
      }

      // password has at least 2 sybols
      var symbols = '.*[!,@,#,$,%,^,&,*,?,_,~]';
      symbols = new RegExp('(' + symbols + symbols + ')');
      if (password.match(symbols)) {
        score += 5;
      }

      // password has Upper and Lower chars
      if (password.match(/([a-z].*[A-Z])|([A-Z].*[a-z])/)) {
        score += 10;
      }

      // password has number and chars
      if (password.match(/([a-zA-Z])/) && password.match(/([0-9])/)) {
        score += 15;
      }

      // password has number and symbol
      if (password.match(/([!,@,#,$,%,^,&,*,?,_,~])/) && password.match(/([0-9])/)) {
        score += 15;
      }

      // password has char and symbol
      if (password.match(/([!,@,#,$,%,^,&,*,?,_,~])/) && password.match(/([a-zA-Z])/)) {
        score += 15;
      }

      // password is just numbers or chars
      if (password.match(/^\w+$/) || password.match(/^\d+$/)) {
        score -= 10;
      }

      if (score > 100) {
        score = 100;
      }

      if (score < 0) {
        score = 0;
      }

      return score;
    }

    /**
     * Checks for repetition of characters in
     * a string
     *
     * @param int rLen Repetition length.
     * @param string str The string to be checked.
     * @return string
     */
    function checkRepetition(rLen, str) {
      var res = "", repeated = false;
      for (var i = 0; i < str.length; i++) {
        repeated = true;
        for (var j = 0; j < rLen && (j + i + rLen) < str.length; j++) {
          repeated = repeated && (str.charAt(j + i) === str.charAt(j + i + rLen));
        }
        if (j < rLen) {
          repeated = false;
        }
        if (repeated) {
          i += rLen - 1;
          repeated = false;
        }
        else {
          res += str.charAt(i);
        }
      }
      return res;
    }

    /**
     * Initializes the plugin creating and binding the
     * required layers and events.
     *
     * @return void
     */
    function init() {
      var shown = true;
      var $text = options.showText;
      var $percentage = options.showPercent;
      var $graybar = $('<div>').addClass('pass-graybar');
      var $colorbar = $('<div>').addClass('pass-colorbar');
      var $insert = $('<div>').addClass('pass-wrapper').append(
        $graybar.append($colorbar)
      );

      $object.closest(options.closestSelector).addClass('pass-strength-visible');
      if (options.animate) {
        $insert.css('display', 'none');
        shown = false;
        $object.closest(options.closestSelector).removeClass('pass-strength-visible');
      }

      if (options.showPercent) {
        $percentage = $('<span>').addClass('pass-percent').text('0%');
        $insert.append($percentage);
      }

      if (options.showText) {
        $text = $('<span>').addClass('pass-text').html(options.enterPass);
        $insert.append($text);
      }

      $object.closest(options.closestSelector).append($insert);

      $object.keyup(function() {
        var field = options.field || '';
        if (field) {
          field = $(field).val();
        }

        var score = calculateScore($object.val(), field);
        $object.trigger('password.score', [score]);
        var perc = score < 0 ? 0 : score;
        $colorbar.css({
          backgroundPosition: "0px -" + perc + "px",
          width: perc + '%'
        });

        if (options.showPercent) {
          $percentage.html(perc + '%');
        }

        if (options.showText) {
          var text = scoreText(score);
          if (!$object.val().length && score <= 0) {
            text = options.enterPass;
          }

          if ($text.html() !== $('<div>').html(text).html()) {
            $text.html(text);
            $object.trigger('password.text', [text, score]);
          }
        }
      });

      if (options.animate) {
        $object.focus(function() {
          if (!shown) {
            $insert.slideDown(options.animateSpeed, function () {
              shown = true;
              $object.closest(options.closestSelector).addClass('pass-strength-visible');
            });
          }
        });

        $object.blur(function() {
          if (!$object.val().length && shown) {
            $insert.slideUp(options.animateSpeed, function () {
              shown = false;
              $object.closest(options.closestSelector).removeClass('pass-strength-visible')
            });
          }
        });
      }

      return this;
    }

    return init.call(this);
  }

  // Bind to jquery
  $.fn.password = function(options) {
    return this.each(function() {
      new Password($(this), options);
    });
  };
})(jQuery);
