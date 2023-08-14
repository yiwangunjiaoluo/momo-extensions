"use strict";

/*
* Options:
* - title   ( string, optional, if value is "" not show.)
*
* - content ( string, required)
*
* - type    ( int, NORMAL/SUCCESS/WARING/ERROR/INFO)
*           ( optional, default is NORMAL )
*
* - mode    ( string, toast/modal/snackbar)
*           ( optional, default is toast )
*
* - delay   ( boolean, optional )
*           ( default is 1000 * 5 )
*
* - icon    ( string,  optional )
*
* - action  ( string,  optional )
* - callback( func,    optional )
*           ( when action != "" must set callback )
*
* Param:
* - string：
*   - 1：content
*   - 2：type content or title content
*
* - object
*   - { type: xxx, title: xxx, content: xxx, mode: xxx, icon: xxx, delay: 500, action: xxx, callback:()=>{xxxx} }
*
* Example:
* new Notify().Render( "一个参数的 toast" );
* new Notify().Render( 0, "两个参数的 toast" );
* new Notify().Render( 1, "两个参数的 toast" );
* new Notify().Render( 2, "两个参数的 toast" );
* new Notify().Render( 3, "两个参数的 toast" );
* new Notify().Render( "snackbar", "两个参数的 snackbar" );
* new Notify().Render( "三个参数的 callback", "undo", ()=>{console.log("bbbbbb")} );
* new Notify().Render( "snackbar", "四个参数的 snackbar callback", "undo", ()=>{console.log("rrrrrr")} );
* new Notify().Render( "SimpTab 版本提示", `已更新到最新版本，详细请看 <a>CHANGELOG</a>` );
* new Notify().Render({ content: "带 icon 的 toast", icon: "<path>/weight_icon.png" } );
* new Notify().Render({ content: "带 delay 的 toast", delay: 10000 } );
* new Notify().Render({ content: "带 icon 的 snackbar", icon: "<path>/fontsize_icon.png" });
* new Notify().Render({ content: "带 callback 的 toast", icon: "<path>/icon.png", mode: "snackbar", action: "提交", callback: ()=>{console.log("dddddddd")}} );
* new Notify().Render( "错误的 callback", "undo", '()=>{console.log("eeeeeeee")}' );
* new Notify().Render({ content: "带确认的 toast", action: "提交", cancel: "取消", callback: type => {
     console.log( "current type is", type )
  }});
  new Notify().Render({ content: "一直存在带 close 的 toast", state: "holdon" });
*
  const notify = new Notify().Render({ content: "加载中，请稍等...", state: "loading" });
  setTimeout( ()=>{
    notify.complete();
    new Notify().Render("加载完成！");
  }, 2000);
* Notify.Position = rt( default ) | rb | lt | lb
*
*/
var Notify = ( function () {
    var VERSION = "2.0.2.0621",
        name    = "notify",
        root    = "notify-gp",
        roottmpl= "<" + root + ">",
        num     = 0,
        NORMAL  = 0,
        SUCCESS = 1,
        WARNING = 2,
        ERROR   = 3,
        INFO    = 4,
        MODE    = {
            toast    : "toast",
            modal    : "modal",
            snackbar : "snackbar",
        },
        STATE   = {
            loading  : "loading",
            holdon   : "holdon",
        },
        POSITION= {
            lefttop     : "lt",
            leftbottom  : "lb",
            rightbottom : "rb",
        },
        options = {
            version : VERSION,
            title   : "",
            content : "",
            type    : NORMAL,
            mode    : MODE.toast,
            state   : undefined,
            flat    : false,
            delay   : 1000 * 5,
            icon    : "",
            action  : "",
            cancel  : "",
            exit    : undefined,
            callback: undefined,
            complete: undefined,
        },
        timer      = {},
        $root,
        TMPL       = '\
        <notify>\
            <notify-a href="javascript:;"><notify-span></notify-span></notify-a>\
            <notify-i></notify-i>\
            <notify-title></notify-title>\
            <notify-content></notify-content>\
            <notify-action></notify-action>\
            <notify-cancel></notify-cancel>\
            <notify-exit></notify-exit>\
        </notify>',
        exit       = '<svg t="1577940123220" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1411" width="24" height="24"><path d="M512 421.490332 331.092592 240.582924C306.351217 215.841549 265.464551 215.477441 240.470996 240.470996 215.303191 265.638801 215.527553 306.037221 240.582924 331.092592L421.490332 512 240.582925 692.907407C215.84155 717.648782 215.477441 758.535449 240.470996 783.529004 265.638801 808.696809 306.037222 808.472446 331.092593 783.417075L512 602.509668 692.907407 783.417075C717.648782 808.15845 758.535449 808.522559 783.529004 783.529004 808.696809 758.361199 808.472446 717.962778 783.417075 692.907407L602.509668 512 783.417076 331.092592C808.158451 306.351217 808.522559 265.464551 783.529004 240.470996 758.361199 215.303191 717.962779 215.527553 692.907408 240.582924L512 421.490332Z" p-id="1412" fill="#ffffff"></path></svg>',
        loading    = '\
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid" class="lds-rolling">\
                <circle stroke="#fff" stroke-width="10" cx="50" cy="50" fill="none" ng-attr-stroke="{{config.color}}" ng-attr-stroke-width="{{config.width}}" ng-attr-r="{{config.radius}}" ng-attr-stroke-dasharray="{{config.dasharray}}" r="30" stroke-dasharray="141.37166941154067 49.12388980384689" transform="rotate(102 50 50)">\
                    <animateTransform attributeName="transform" type="rotate" calcMode="linear" values="0 50 50;360 50 50" keyTimes="0;1" dur="1s" begin="0s" repeatCount="indefinite"></animateTransform>\
                </circle>\
            </svg>',
        prefix     = function( value ) {
            return name + "-" + value;
        },
        registyElement = function( name, elements ) {
            elements.forEach( function( item ) {
                document.createElement( prefix( item ));
            });
        },
        closeHandle = function( event ) {
            $root.off( "click", "." + event.data + " notify-a", closeHandle );
            hidden( $(this).parent() );
        },
        delayHandler = function( item ) {
            clearTimeout( timer[item] );
            delete timer[item];
            hidden( this );
        },
        callbackHander = function( event ) {
            event.data[1] && event.data[1]( event.data[2] );
            $root.off( "click", "." + event.data[0] + " notify-action", callbackHander );
            hidden( $(this).parent() );
        },
        completeHandler = function() {
            hidden( this );
        },
        hidden = function( target ) {
            target[0].addEventListener( 'animationend', function(e) {
                target.remove();
                if ($root.children().length === 0 ) $root.css( "z-index", 0 );
            }, false );
            target.css({ width: target[0].offsetWidth }).addClass( 'notify-hide' );
        },
        render = function() {
            var $target  = $( TMPL ),
                $title   = $target.find(prefix( "title"   )),
                $content = $target.find(prefix( "content" )),
                $close   = $target.find(prefix( "a"       )),
                $icon    = $target.find(prefix( "i"       )),
                $action  = $target.find(prefix( "action"  )),
                $cancel  = $target.find(prefix( "cancel"  )),
                $exit    = $target.find(prefix( "exit"    )),
                item     = "notify-item-" + num++,
                position = this.constructor.Position,
                isMobile = {
                    Android: function() {
                        return navigator.userAgent.match(/Android/i);
                    },
                    BlackBerry: function() {
                        return navigator.userAgent.match(/BlackBerry/i);
                    },
                    iOS: function() {
                        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
                    },
                    Opera: function() {
                        return navigator.userAgent.match(/Opera Mini/i);
                    },
                    Windows: function() {
                        return navigator.userAgent.match(/IEMobile/i);
                    },
                    verify: function() {
                        return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows()) == null ? false : true;
                    }
                };

            this.title   ? $title.text( this.title )     : $title.hide();
            this.content ? $content.html( this.content ) : $content.hide();

            this.update = function( content ) {
                this.content = content;
                this.content ? $content.html( this.content ) : $content.hide();
            }

            if ( this.mode === MODE.modal ) {
                $target.addClass( "notify-modal" );
                $content.addClass( "notify-modal-content" );
                $root.on( "click", "." + item + " notify-a", item, closeHandle );
            } else {
                $close.hide();
                this.mode == MODE.snackbar && $target.addClass( "notify-snackbar" );
            }

            if ( this.mode !== MODE.modal && this.icon !== "" ) {
                if ( this.icon.indexOf( '<i' ) > -1 ) {
                    $icon.html( this.icon ).css({ display: 'flex' });
                } else $icon.css({ "background-image": "url(" + this.icon + ")", "display": "block" });
            }

            switch( this.type ) {
                case 1:
                    this.state != STATE.holdon && this.icon == "" && $icon.html( '<i class="fas fa-check"></i>' ).css({ display: 'flex' });
                    $target.addClass( "notify-success" );
                    break;
                case 2:
                    this.state != STATE.holdon && this.icon == "" && $icon.html( '<i class="fas fa-exclamation"></i>' ).css({ display: 'flex' });
                    $target.addClass( "notify-warning" );
                    break;
                case 3:
                    this.state != STATE.holdon && this.icon == "" && $icon.html( '<i class="fas fa-bug"></i>' ).css({ display: 'flex' });
                    $target.addClass( "notify-error" );
                    break;
                case 4:
                    this.state != STATE.holdon && this.icon == "" && $icon.html( '<i class="fas fa-info"></i>' ).css({ display: 'flex' });
                    $target.addClass( "notify-info" );
                    break;
            }

            if ( this.action !== "" && this.callback && typeof this.callback == "function" ) {
                $content.css( "width", "100%" );
                $action.text( this.action ).css( "display", "block" );
                $root.on( "click", "." + item + " notify-action", [ item, this.callback, "action" ], callbackHander );
            }

            if ( this.cancel !== "" && this.callback && typeof this.callback == "function" ) {
                $content.css( "width", "100%" );
                $cancel.text( this.cancel ).css( "display", "block" );
                $root.on( "click", "." + item + " notify-cancel", [ item, this.callback, "cancel" ], callbackHander );
            }

            if ( this.type != 0 && this.icon.indexOf( '<i' ) > -1 ) {
                var css = function( element, property ) {
                    return window.getComputedStyle( element, null ).getPropertyValue( property ).toLowerCase().replace( / /g, "" );
                }, $span = $( '<span style="display:none;" class="verify-fas fas"></span>' )
                $( 'body' ).append( $span );
                !/fontawesome/.test( css( $span[0], 'font-family' ) ) && $icon.remove();
                $span.remove();
            }

            this.mode !== MODE.modal && this.state !== STATE.loading && this.state !== STATE.holdon && ( this.action == "" || !this.callback || typeof this.callback != "function" ) &&
                ( timer[item] = setTimeout( delayHandler.bind( $target, item ), this.delay ) );

            if ( this.state == STATE.loading ) {
                $icon.html( loading );
                $icon.css({ display: "block" });
                this.complete = completeHandler.bind( $target );
            }

            if ( this.state == STATE.holdon ) {
                $icon.css({ display: "block" }).addClass( "holdon" );
                $cancel.after( $icon[0].outerHTML );
                $target.find( "notify-i:first" ).remove();
                $root.on( "click", "." + item + " notify-i", [ item, this.callback, "holdon" ], callbackHander );
                if ( !this.action || !this.cancel ) $content.css({ width: "100%" });
            }

            if ( this.flat ) {
                $target.css({ "box-shadow": "none", "border-radius": "2px" });
            }

            if ( position == POSITION.rightbottom || position == POSITION.leftbottom ) {
                $target.css({ "transform-origin": "left bottom 0px" });
                $root.addClass( "notify-position-" + position + "-corner" );
            } else if ( position == POSITION.lefttop ) {
                $root.addClass( "notify-position-" + position + "-corner" );
            }

            $target.addClass( item );
            $root.css( "z-index", 2147483647 );
            isMobile.verify() ? $root.prepend( $target ) : $root.append( $target );

            if ( this.mode == MODE.snackbar || this.exit ) {
                $target.css( "margin-left", "-" + $target.width()/2 + "px" );
                if ( this.cancel == "" ) {
                    $exit.html( exit ).css( "display", "flex" );
                    $root.on( "click", "." + item + " notify-exit", closeHandle );
                }
            }
            setTimeout( function() { $target.addClass( "notify-show" ); }, 200 );
        };

    function Notify() {
        registyElement( name, [ "gp", "div", "a", "span", "title", "content", "i" ] );
        if ( $( "html" ).find ( root ).length == 0 ) {
            $( "html" ).append( roottmpl );
            $root = $( root );
        }
    }

    Notify.prototype.title   = options.title;
    Notify.prototype.content = options.content;
    Notify.prototype.type    = options.type;
    Notify.prototype.mode    = options.mode;
    Notify.prototype.state   = options.state;
    Notify.prototype.delay   = options.delay;
    Notify.prototype.icon    = options.icon;
    Notify.prototype.flat    = options.flat;
    Notify.prototype.action  = options.action;
    Notify.prototype.cancel  = options.cancel;
    Notify.prototype.callback= options.callback;
    Notify.prototype.complete= options.complete;
    Notify.Position          = undefined;

    Notify.prototype.Render  = function () {

        var self = this;

        if ( arguments.length === 1 && typeof arguments[0] === "object" ) {
            options = arguments[0];

            Object.keys( options ).forEach( function( item ) {
                self[item] = options[item];
            });

            render.bind( self )();
        }
        else if ( typeof arguments[0] !== "object" && arguments.length > 0 && arguments.length < 5 ) {
            switch ( arguments.length ) {
                case 1:
                    this.content = arguments[0];
                    break;
                case 2:
                    if ( arguments[0] == MODE.snackbar ) {
                        this.mode = arguments[0];
                    }
                    else if ( typeof arguments[0] == "number" ) {
                        this.type  = arguments[0];
                    } else {
                        this.mode  = MODE.modal,
                        this.title = arguments[0];
                    }
                    this.content   = arguments[1];
                    break;
                case 3:
                    this.content   = arguments[0];
                    this.action    = arguments[1];
                    this.callback  = arguments[2];
                    this.exit      = true;
                    break;
                case 4:
                    if ( arguments[0] == MODE.snackbar ) {
                        this.mode      = arguments[0];
                        this.content   = arguments[1];
                        this.action    = arguments[2];
                        this.callback  = arguments[3];
                    }
                    break;
            }
            render.bind( self )();
        }
        else {
            console.error( "Arguments error", arguments );
        }
        return self;
    };

    Notify.prototype.Clone  = function () {
        return new Notify();
    };

    return Notify;

})();

module.exports = Notify;