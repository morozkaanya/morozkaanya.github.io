<?php

/*
 * LinkorCMS 1.4
 * © 2012 LinkorCMS Development Group
 */


if(!defined('VALID_RUN')){
	header("HTTP/1.1 404 Not Found");
	exit;
}

define('FORMS_UFU', GetSiteUrl().Ufu('index.php?name=forms', 'system:mod'));
System::site()->SetTitle('Web-формы');

include_once System::config('inc_dir').'forms.inc.php';

if(!isset($_GET['op'])){
	$op = 'main';
}else{
	$op = $_GET['op'];
}

if(isset($_GET['form'])){
	$id = SafeEnv($_GET['form'], 11, int);
	$form = System::database()->SelectOne('forms', "`id`='$id' && `active`='1'");
	if($form === false){
		GO(FORMS_UFU);
	}
}elseif(isset($_GET['formlink'])){
	$link = SafeEnv(Utf8ToCp1251(rawurldecode($_GET['formlink'])), 255, str);
	$form = System::database()->SelectOne('forms', "`link`='$link' && `active`='1'");
	if($form === false){
		GO(FORMS_UFU);
	}
}

switch($op){
	case 'main':
		if(!isset($form)){
			IndexFormsMain();
			break;
		}
	case 'view':
		IndexFormsViewForm($form);
		break;
	case 'save':
		IndexFormSave($form);
		break;
	default:
		GO(FORMS_UFU);
}

// Главная страница модуля веб-форм. Список форм.
function IndexFormsMain(){
	$forms = System::database()->Select('forms', GetWhereByAccess('view', "`active`='1'"));
	if(System::database()->NumRows() == 0){
		GO(FORMS_UFU);
	}
	System::site()->AddTemplatedBox('', 'module/forms_list.html');
	System::site()->AddBlock('forms_list', true, true, 'form');
	foreach($forms as $form){
		$vars = array();
		$vars['link'] = Ufu('index.php?name=forms&formlink='.SafeDB($form['link'], 255, str), 'forms:form');
		$vars['title'] = SafeDB($form['hname'], 255, str);
		System::site()->AddSubBlock('forms_list', true, $vars);
	}
}

// Выводит форму
function IndexFormsViewForm( $form ){

	$form_id = SafeEnv($form['id'], 11, int);

	System::site()->AddBlock('forms', true, false, 'form');
	System::site()->AddBlock('form_fields', true, true, 'field');
	System::site()->AddTemplatedBox('', 'module/forms.html');

	$vars['title'] = SafeDB($form['hname'], 255, str);
	System::site()->SetTitle($vars['title']);
	System::site()->BreadCrumbAdd($vars['title']);

	$vars['desc'] = SafeDB($form['desc'], 0, str, false, false);
	$controls = unserialize($form['form_data']);
	if(trim($form['action']) != ''){
		$action = SafeDB($form['action'], 250, str);
	}else{
		$action = Ufu("index.php?name=forms&form=$form_id&op=save", 'forms/{op}/');
	}

	$enctype = '';
	foreach($controls as $control){
		$kind = explode(':', $control['kind']);
		if($kind[0] == 'file'){
			$enctype = 'multipart/form-data';
		}
		$control_vars = array();
		$control_vars['hname'] = SafeEnv($control['hname'], 255, str);
		$control_vars['control'] = FormsGetControl(SafeDB($control['name'], 255, str), '', $control['kind'], $control['type'], $control['values']);
		System::site()->AddSubBlock('form_fields', true, $control_vars);
	}
	$vars['open'] = System::site()->FormOpen($action, 'post', $enctype == 'multipart/form-data');
	$vars['close'] = System::site()->FormClose();
	$vars['submit'] = System::site()->Submit('Отправить форму');

	// Капча
	$vars['show_kaptcha'] = !System::user()->Auth || (System::config('forms/show_captcha') && !System::user()->isAdmin());
	$vars['kaptcha_url'] = 'index.php?name=plugins&p=antibot';
	$vars['kaptcha_width'] = '120';
	$vars['kaptcha_height'] = '40';

	System::site()->Blocks['forms']['vars'] = $vars;
}

function IndexFormGetValues( $name, $values ){
	$vals = explode(':', $values);
	if($vals[0] == 'function'){
		$func = CONF_GET_PREFIX.trim($vals[1]);
		$values = $func($name);
		$vals = array();
		for($i = 0, $cnt = count($values); $i < $cnt; $i++){
			$vals[$values[$i][0]] = $values[$i][1];
		}
	}else{
		$values = explode(',', $values);
		$vals = array();
		for($i = 0, $cnt = count($values); $i < $cnt; $i++){
			$vv = explode(':', $values[$i]);
			$vals[$vv[0]] = $vv[1];
		}
	}
	return $vals;
}

// Отправка формы на email.
function IndexFormSendMail( $email, $form_name, $time, $user, $ip, $data_rows ){
	if($user != 0){
		$user_info = GetUserInfo($user);
		$user = SafeDB($user_info['name'], 255, str).' ( id:'.SafeDB($user_info['id'], 11, int).' )';
		$from = $user_info['name'];
		$from_email = $user_info['email'];
	}else{
		$user = 'Не зарегистрирован';
		$from = ''; // Система подставит название и email сайта
		$from_email = '';
	}
	$post_text = '';
	foreach($data_rows as $row){
		$post_text .= '<b>'.SafeDB($row[0], 255, str).':</b><br />'.SafeDB($row[1], 0, str).'<br />';
	}
	$text = Indent('
		<html>
		<head>
			<title>Форма</title>
		</head>
		<body>
			<table cellspacing="2" cellpadding="10" border="1">
				<tr>
					<th>Дата: '.TimeRender($time, true, false).'</th>
					<th>Пользователь: '.$user.'</th>
					<th>IP: '.$ip.'</th>
				</tr>
				<tr>
					<td colspan="3" style="text-align: left;">'.$post_text.'</td>
				</tr>
			</table>
		</body>
		</html>
	');
	SendMail('Администратор', $email, 'Веб форма "'.$form_name.'"', $text, true, $from, $from_email);
}

function IndexFormSave( $form ){

	// Проверяем капчу
	if(!System::user()->Auth || (!System::user()->isAdmin() && System::config('forms/show_captcha'))){
		if(!isset($_POST['keystr']) || !System::user()->isDef('captcha_keystring') || System::user()->Get('captcha_keystring') != $_POST['keystr']){
			$text = '<p align="center">Вы ошиблись при вводе кода с картинки. Форма не отправлена.</p>';
			$text .= '<p align="center"><input type="button" value="Назад" onclick="history.back();"></p>';
			System::site()->AddTextBox('', $text);
			return;
		}
	}

	$controls = unserialize($form['form_data']);
	$post_data = array();
	foreach($controls as $control){
		$name = $control['name'];
		$hname = $control['hname'];
		$kind = explode(':', $control['kind']);
		$kind = trim(strtolower($kind[0]));
		$savefunc = trim($control['savefunc']);
		$type = trim($control['type']);
		if($type != ''){
			$type = explode(',', $type);
		}else{
			$type = array(255, str, false);
		}
		switch($kind){
			case 'edit':
				if(FormsConfigCheck2Func('function', $savefunc, 'save')){
					$value = CONF_SAVE_PREFIX.$savefunc(FormsCheckType($_POST[$name], $type));
				}else{
					$value = FormsCheckType($_POST[$name], $type);
				}
				break;
			//case 'radio' :
			case 'combo':
				$vals = IndexFormGetValues($name, $control['values']);
				if(FormsConfigCheck2Func('function', $savefunc, 'save')){
					$value = CONF_SAVE_PREFIX.$savefunc(FormsCheckType($_POST[$name], $type));
				}else{
					$value = $vals[$_POST[$name]];
				}
				break;
			case 'text':
				if(FormsConfigCheck2Func('function', $savefunc, 'save')){
					$value = CONF_SAVE_PREFIX.$savefunc(FormsCheckType($_POST[$name], $type));
				}else{
					$value = FormsCheckType($_POST[$name], $type);
				}
				break;
			case 'check':
			case 'list':
				$vals = IndexFormGetValues($name, $control['values']);
				if(FormsConfigCheck2Func('function', $savefunc, 'save')){
					$value = CONF_SAVE_PREFIX.$savefunc(FormsCheckType($_POST[$name], $type));
				}else{
					if(isset($_POST[$name])){
						$c = count($_POST[$name]);
					}else{
						$c = 0;
					}
					$value = '';
					for($k = 0; $k < $c; $k++){
						$value .= ',';
						$value .= $vals[$_POST[$name][$k]];
					}
					$value = substr($value, 1);
				}
				break;
			/*
			case 'file':
				if(FormsConfigCheck2Func('function',$savefunc,'save')){
					$value = CONF_SAVE_PREFIX.$savefunc(FormsCheckType($_POST[$name],$type));
				}else{
					$value = FormsCheckType($_POST[$name],$type);
				}
			break;
			*/
			default:
				if(FormsConfigCheck2Func('function', $savefunc, 'save')){
					$value = CONF_SAVE_PREFIX.$savefunc(FormsCheckType($_POST[$name], $type));
				}else{
					$value = FormsCheckType($_POST[$name], $type);
				}
		}
		$post_data[] = array($hname, $value, $type);
	}
	$form_id = SafeEnv($form['id'], 11, int);
	if(System::user()->Auth){
		$user_id = System::user()->Get('u_id');
	}else{
		$user_id = 0;
	}
	$time = time();
	$ip = getip();

	if($form['email'] != ''){
		IndexFormSendMail($form['email'], $form['hname'], $time, $user_id, $ip, $post_data);
	}

	$data = serialize($post_data);
	$data = SafeEnv($data, 0, str);
	System::database()->Insert('forms_data', "'','$form_id','$user_id','$time','$data','0','$ip'");

	$new = $form['new_answ'] + 1;
	$cnt = $form['answ'] + 1;
	System::database()->Update('forms', "`answ`='$cnt',`new_answ`='$new'", "`id`='$form_id'");

	if($form['send_ok_msg'] != ''){
		$msg = SafeDB($form['send_ok_msg'], 0, str, false, false);
	}else{
		$msg = 'Ваша форма отправлена успешно.';
	}
	System::site()->AddTextBox('', '<p align="center">'.$msg.'</p>');
}
?>
