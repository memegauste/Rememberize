// RememberizeJS 0.1 - don't forget formdata on reload.
// Requires cookiejs and jquery for now.

const DJANGO_BLACKLIST = [
    'csrfmiddlewaretoken',
    'TOTAL_FORMS',
    'INITIAL_FORMS',
    'MIN_NUM_FORMS',
    'MAX_NUM_FORMS',
    'current_step',
]

const miniCookieLib = {
    setCookie: (name, value, days) => {
        let expires = "";
        if(days){
            let date = new Date();
            date.setTime(date.getTime() + (days*24*60*60*1000));
            expires = `; expires=${date.toUTCString()}`;
        }
        document.cookie = name + "=" + (value || "")  + expires + "; path=/";
    },
    getCookie: (name) => {
        let nameEQ = name + "=";
        let ca = document.cookie.split(';');
        for(let i=0;i < ca.length;i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1,c.length);
            if (!c.indexOf(nameEQ)) return c.substring(nameEQ.length,c.length);
        }
        return null;
    },
    getAllCookies: () => {
      let pairs = document.cookie.split(";");
      let cookies = {};
      pairs.forEach((element) => {
        let item = element.split('=');
        cookies[(`${item[0]}`).trim()] = unescape(item.slice(1).join('='));
      });
      return cookies;
    },
    removeCookie: (name) => {
        document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
    }
};

let rememberize = {
    DEFAULT_EXPIRE_DAYS: 3,
    isCKeditor: (field) => {
        let ID = field.attr('id');
        let checkCKeditor = $(`#cke_${ID}`);
        return !!checkCKeditor.length;
    },
    cleanFields: function(form){
        let inputs = form.find('input, select');
        return inputs.filter(function() {
            let curr = this;
            let result = true;
            DJANGO_BLACKLIST.forEach((entry) => {
                if($(curr).attr('name') &&
                    $(curr).attr('name').endsWith(entry)) result = false;
            });
            return result;
        });
    },
    saveTextareas: function(form){
        const self = this;
        let textareas = form.find('textarea');
        textareas.each(function(){
            let val;
            if(self.isCKeditor($(this))) val = CKEDITOR.instances[$(this).attr('id')].getData();
            else val = $(this).val();
            Cookies.set(
                `rememberize[textarea]-${$(this).attr('id')}`, val, this.DEFAULT_EXPIRE_DAYS)
        });
    },
    saveToCookie: function(form){
        Cookies.set(`rememberize-${form.attr('id')}`,
            this.cleanFields(form).serialize(), {expires: this.DEFAULT_EXPIRE_DAYS})
        this.saveTextareas(form);
    },
    initEvent: function(form){
        const self = this;
        form.find('input, select').on('change', () => {
            self.saveToCookie(form);
        });
        form.find('textarea').each(function(){
            if(self.isCKeditor($(this))){
                CKEDITOR.instances[$(this).attr('id')].on('change', function(){
                    self.saveTextareas(form);
                })
            } else $(this).on('change', () => {
                self.saveTextareas(form);
            })
        })
    },
    execute: function(selector){
        let self = this;
        selector.each(function(){
            if($(this).attr('id')) self.initEvent($(this));
        });
    },
    loadToForm: function(id, serializedData){
        $.each(serializedData.split('&'), (index, elem) => {
            let vals = elem.split('=');
            let field = $(`#${id}`).find("[name='" + vals[0] + "']");
            let value = decodeURIComponent(vals[1].replace(/\+/g, ' '));
            if(field.attr('type') === 'checkbox'){
                field.filter(function(){
                    return this.value===value
                }).prop('checked', true);
            }
            else field.val(value);
        });
    },
    formalize: function(){
        let self = this;
        let allCookies = Cookies.get();
        Object.keys(allCookies).forEach(key => {
            if(key.startsWith('rememberize-')){
                this.loadToForm(key.replace('rememberize-', ''), allCookies[key])
            }
            else if(key.startsWith('rememberize[textarea]-')){
                let selector = $(`#${key.replace('rememberize[textarea]-', '')}`);
                if(self.isCKeditor(selector)) CKEDITOR.instances[selector.attr('id')].setData(allCookies[key]);
                else selector.val(allCookies[key]);
            }
        })
    },
    cleanUp: function(){
        Object.keys(Cookies.get()).forEach(key => {
            key.startsWith('rememberize') && Cookies.remove(key);
        });
    },
    overallInit: function(selector){
        this.execute(selector);
        this.formalize();
    }
}