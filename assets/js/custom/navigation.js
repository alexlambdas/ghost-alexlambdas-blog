function capitalizeFirstLetter(word){

  if(R.isNil(word) || R.isEmpty(word)) return '';

  return R.compose(
    R.join(''),
    R.over(R.lensIndex(0), R.toUpper),
    R.split('')
  )(word);
}


function capitalizePhrase(phrase){

  if(R.isNil(phrase) || R.isEmpty(phrase)) return '';

  return R.compose(
    R.join(' '),
    R.map(capitalizeFirstLetter),
    R.split('-')
  )(phrase);
}

function normalizeString(str){

  if(R.isNil(str) || R.isEmpty(str)) return str;

  const htmlUrlEncode = [
    ['%C3%81','a'], // Á
    ['%C3%89','e'], // É
    ['%C3%8D','i'], // Í
    ['%C3%93','o'], // Ó
    ['%C3%9A','u'], // Ú
    ['%C3%A1','a'], // á
    ['%C3%A9','e'], // é
    ['%C3%AD','i'], // í
    ['%C3%B3','o'], // ó
    ['%C3%BA','u'], // ú
  ];

  let href = R.reduce((acc,val) => R.replace(R.head(val),R.last(val),acc),str,htmlUrlEncode);
  href = href.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  href = R.toLower(href);
  return href;
}

function isSubMenu(str){

  if(R.isNil(str) || R.isEmpty(str)) return false;

  const splitDollar = R.split('$',str);
  if(R.length(splitDollar) > 2) return false;

  const splitSlash = R.split('/', R.last(splitDollar));
  const category = R.head(splitSlash);
  const subCategory = R.head(R.tail(splitSlash));
  if(R.isEmpty(category) || R.isEmpty(subCategory)) return false;

  return true;
}

function getDomainMenuSubMenu(str){

  const splitDollar = R.split('$',str);
  const splitSlash = R.split('/', R.last(splitDollar));

  return {
    domain: R.head(splitDollar),
    menu: R.head(splitSlash),
    subMenu: R.head(R.tail(splitSlash)),
  };
}

function setMenuProperties(obj){
  return{
    ...obj,
    type:{
      menu: true,
      subMenu: false,
    },
    url:{
      menu: normalizeString(obj.href),
      subMenu: '',
    },
    textContent:{
      menu: obj.$LI.textContent.toString().trim(),
      subMenu: '',
    }
  }
}

function setSubMenuProperties(obj){

  const {domain,menu,subMenu} = getDomainMenuSubMenu(obj.href);

  return{
    ...obj,
    type:{
      menu: false,
      subMenu: true,
    },
    url: {
      menu: normalizeString(domain+menu),
      subMenu: normalizeString(`${domain+menu}/${subMenu}`)
    },
    textContent: {
      menu: obj.$LI.textContent.toString().trim(),
      subMenu: capitalizePhrase(subMenu)
    }
  }
}


function createMenuInformation($LI){

  if(R.isNil($LI)) return {};
  const $A = $LI.querySelector('a');
  const href = $A.href;

  const state = {
    $LI: $LI,
    href: href,
    type: {
      menu: false,
      subMenu: false,
    },
    url: {
      menu: '',
      subMenu: '',
    },
    textContent: {
      menu: '',
      subMenu: '',
    },
  };

  if(isSubMenu(href)) return setSubMenuProperties(state);
  else return setMenuProperties(state);
}

function removeChildsElements_HTML(l$childs){
  R.forEach($element => $element.parentElement.removeChild($element),l$childs);
}

function getItems_LI_from_UL(l$LI){
  return function(fnPredicate){
    return R.compose(
      R.pluck('$LI'),
      R.filter(fnPredicate),
      R.map($LI => createMenuInformation($LI))
    )(l$LI);
  }
}

function replaceHref_A(menuInformation){
  return function(fnPredicate){

    const replace = (obj) => {
      const $A = obj.$LI.querySelector('a');
      $A.href = obj.url.menu;
    };

    R.compose(
      R.forEach(replace),
      R.filter(fnPredicate)
    )(menuInformation);

  }
}

function createMenuNavigation($FRAGMENT_$NAV){

  const $NAV = $FRAGMENT_$NAV.querySelector('nav');
  const $UL = $NAV.querySelector('ul');
  const l$LI = $UL.querySelectorAll('li');

  const menuInformation = R.map($element => createMenuInformation($element),l$LI);
  const predicMenus = (obj => obj.type.menu === true);
  replaceHref_A(menuInformation)(predicMenus);

  const predicSubMenus = (obj) => obj.type.subMenu === true;
  const l$LI_ofSubMenu = getItems_LI_from_UL(l$LI)(predicSubMenus);
  removeChildsElements_HTML(l$LI_ofSubMenu);
}

function beginDOMContentLoaded(){

  const $NAV = document.querySelector('.gh-head-menu');
  const $NAV_clone = $NAV.cloneNode(true);
  const $FRAGMENT_$NAV = document.createDocumentFragment();
  $FRAGMENT_$NAV.appendChild($NAV_clone);
  createMenuNavigation($FRAGMENT_$NAV);
  const $NAV_new = $FRAGMENT_$NAV.querySelector('nav');
  $NAV.parentElement.replaceChild($NAV_new,$NAV);
}

document.addEventListener('DOMContentLoaded',beginDOMContentLoaded);
