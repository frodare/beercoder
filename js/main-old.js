(function () {
  'use strict';




  function onImageFetched(e) {
    var elem = document.getElementById('user_info');
    if (!elem) return;
    if (this.status != 200) return;
    var imgElem = document.createElement('img');
    imgElem.src = window.webkitURL.createObjectURL(this.response);
    elem.appendChild(imgElem);
  }

  function fetchImageBytes(user_info) {
    if (!user_info || !user_info.picture) return;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', user_info.picture, true);
    xhr.responseType = 'blob';
    xhr.onload = onImageFetched;
    xhr.send();
  }

  function populateUserInfo(user_info) {
    var elem = document.getElementById('user_info');
    if (!elem) return;
    var nameElem = document.createElement('div');
    nameElem.innerHTML = "<b>Hello " + user_info.name + "</b>";
    elem.appendChild(nameElem);
    fetchImageBytes(user_info);
  }

  function onUserInfoFetched(e) {
    if (this.status != 200) return;
    console.log("Got the following user info: " + this.response);
    var user_info = JSON.parse(this.response);
    populateUserInfo(user_info);
  }

  function onGetAuthToken(auth_token) {
    var userInfoDiv = document.getElementById('user_info');
    if (!auth_token) {
      var signinButton = document.createElement('button');
      signinButton.id = 'signin';
      signinButton.appendChild(document.createTextNode('Sign In'));
      signinButton.onclick = getUserInfoInteractive;
      userInfoDiv.appendChild(signinButton);
      return;
    }
    // Remove the sign in button if it exists.
    if (userInfoDiv.firstChild) {
      userInfoDiv.removeChild(userInfoDiv.firstChild);
    }
    // Use the auth token to do an XHR to get the user information.
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://www.googleapis.com/oauth2/v1/userinfo?alt=json');
    xhr.setRequestHeader('Authorization', 'Bearer ' + auth_token);
    xhr.onload = onUserInfoFetched;
    xhr.send();

    /*
     * open fs
     */
    fssync(auth_token);
    
  }

  function getUserInfo() {
    chrome.experimental.identity.getAuthToken({ 'interactive': false }, onGetAuthToken);
  }

  function getUserInfoInteractive() {
    chrome.experimental.identity.getAuthToken({ 'interactive': true }, onGetAuthToken);
  }

  window.onload = getUserInfo;



  function fssync(auth_token) {
     console.log('Obtaining syncable FileSystem...');
      chrome.syncFileSystem.requestFileSystem(function (fs) {
        if (chrome.runtime.lastError) {
          //error('requestFileSystem: ' + chrome.runtime.lastError.message);
         // $('#fs-syncable').classList.remove('selected');
         // hide('#conflict-policy')
          console.log('error: ', chrome.runtime.lastError);
          return;
        }
        onFileSystemOpened(fs, true);
      });



    $.ajax('https://www.googleapis.com/drive/v2/files?key=AIzaSyD1w5L_YVPuxYNkMcksqVI_w54y6Z-8ZT8');

  }


  function onFileSystemOpened(fs) {
    console.log('opened fs', fs);
    //list(fs.root);

  }

  

}());


/*
var supportsSyncFileSystem = chrome && chrome.syncFileSystem;

document.addEventListener(
  'DOMContentLoaded',
  function() {
    $('#fs-syncable').addEventListener('click', openSyncableFileSystem);
    $('#fs-temporary').addEventListener('click', openTemporaryFileSystem);

    if (supportsSyncFileSystem)
      openSyncableFileSystem();
    else
      openTemporaryFileSystem();
  }
);

function onFileSystemOpened(fs, isSyncable) {
  log('Got Syncable FileSystem.');
  console.log('Got FileSystem:' + fs.name);
  var editor = new Editor(fs, 'editor');
  var filer = new Filer(fs, 'filer', editor, isSyncable);
  editor.filer = filer;
}

function openTemporaryFileSystem() {
  $('#fs-temporary').classList.add('selected');
  $('#fs-syncable').classList.remove('selected');
  hide('#conflict-policy')
  webkitRequestFileSystem(TEMPORARY, 1024,
                          onFileSystemOpened,
                          error.bind(null, 'requestFileSystem'));
}

function openSyncableFileSystem() {
  if (!chrome || !chrome.syncFileSystem ||
      !chrome.syncFileSystem.requestFileSystem) {
    error('Syncable FileSystem is not supported in your environment.');
    return;
  }
  $('#fs-syncable').classList.add('selected');
  $('#fs-temporary').classList.remove('selected');
  if (chrome.syncFileSystem.setConflictResolutionPolicy) {
    chrome.syncFileSystem.setConflictResolutionPolicy('last_write_win');
    show('#conflict-policy')
  }
  log('Obtaining syncable FileSystem...');
  chrome.syncFileSystem.requestFileSystem(function (fs) {
    if (chrome.runtime.lastError) {
      error('requestFileSystem: ' + chrome.runtime.lastError.message);
      $('#fs-syncable').classList.remove('selected');
      hide('#conflict-policy')
      return;
    }
    onFileSystemOpened(fs, true);
  });
}

$('#conflict-policy').addEventListener('click', function() {
  if ($('#auto-conflict-resolve').checked)
    policy = 'last_write_win';
  else
    policy = 'manual';
  chrome.syncFileSystem.setConflictResolutionPolicy(policy);
  log('Changed conflict resolution policy to: ' + policy);
});
*/


