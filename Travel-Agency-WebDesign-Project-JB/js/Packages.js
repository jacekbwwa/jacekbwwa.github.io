 
/* initials JB*/

document.addEventListener("DOMContentLoaded", setupControl, false);
      function setupControl() { 
          
          var myVideo = document.getElementById("myVideo"); // get video element from webPage 
          if (myVideo.canPlayType) {
             
             myVideo.removeAttribute("controls");   // remove the default buttons

             document.getElementById("controls").style.display="block"; //get div controls
             document.getElementById("loadBar").style.display="block"; //get div loadBar 
     
             myVideo.addEventListener("timeupdate", updateLoadStatus, false); // add event-handlers to video
             myVideo.addEventListener("ended", endPlay, false); // add event-handlers to video
             // enable and disable the controls buttons to reflect the player state
			  
             myVideo.addEventListener("play",function() {  //add function play
                 document.getElementById("start").disabled=true;  //disable start button for play function
                 document.getElementById("pause").disabled=false; //disable pause button for play function
                 document.getElementById("stop").disabled=false; //disable stop button for play function
                 document.getElementById("volUp").disabled=false; //disable volUp button for play function
                 document.getElementById("volDn").disabled = false; //disable volDn button for play function
                 document.getElementById("mute").disabled=false; //disable mute button for play function
              }, false);
			  
             myVideo.addEventListener("pause", function() {
                 document.getElementById("start").disabled=false; //disable start button for pause function
                 document.getElementById("pause").disabled=true; //enable pause button for pause function
                 document.getElementById("volUp").disabled=true; //disable volUp button for pause function
                 document.getElementById("volDn").disabled = true; //disable volDn button for pause function
                 document.getElementById("mute").disabled=true; //disable mute button for pause function
                }, false);
			  
           // add event-handlers for the control buttons
             document.getElementById("start").addEventListener("click",startPlay,false); //add event-handlers to start button
             document.getElementById("stop").addEventListener("click",stopPlay,false); //add event-handlers to stop button
             document.getElementById("pause").addEventListener("click",pausePlay,false); //add event-handlers to pause button
             document.getElementById("volUp").addEventListener("click",volumeUp, false); //add event-handlers to volUp button
             document.getElementById("volDn").addEventListener("click", volumeDown, false); //add event-handlers to volDn button
             document.getElementById("mute").addEventListener("click", toggleMute, false); //add event-handlers to start button
         }
    }
  
  //Event-handlers defining
       
       // when play button is pushed, video is starting to play and the color of the background is changed
       function startPlay() {
          document.getElementsByTagName("body")[0].style.backgroundColor="#005700";
          document.getElementById("myVideo").play();
       }
       // The media play is paused when the pause button is pushed
       function pausePlay() {
          document.getElementById("myVideo").pause();
       }
       // The media play stops, and the current play time is reset to 0  , when stop button is pushed
       function stopPlay() {
          var myVideo = document.getElementById("myVideo");
          myVideo.pause();
          myVideo.currentTime=0;
          endPlay();
       }  
  //The sound volume is increased by 10% whenthe volUp button is pushed, 
  function volumeUp() {
      //get the current volume
     var myVideo = document.getElementById("myVideo");
     var volume = Math.floor(myVideo.volume * 10)/10; //JavaScript floor() Method Round a number downward to its nearest integer
     myVideo.muted = false;
     if(volume >= 0.9) { myVideo.volume = 1; }
     else { myVideo.volume += 0.1; }
  }  
  //The sound volume is decreased by 10% when the volDn button is pushed, 
  function volumeDown() {
    //get the current volume
    var myVideo = document.getElementById("myVideo");
    var volume = Math.floor(myVideo.volume * 10)/10;
    myVideo.muted = false;
    if(volume <= 0.1) { myVideo.volume = 0;}
    else {myVideo.volume -= 0.1; }
  }
  
 //Toggle between Mute and Unmute state when the mute button is pushed
  function toggleMute() {
    var myVideo = document.getElementById("myVideo");
    var mute = document.getElementById("mute");
    if(myVideo.muted) {
    mute.innerHTML = "Mute";  //The innerHTML property sets or returns the HTML content (inner HTML) of an element.
    myVideo.muted = false; //The muted property sets or returns whether the audio/video should be muted (sound turned on).
   } else {
    mute.innerHTML= "Unmute"; //The innerHTML property sets or returns the HTML content (inner HTML) of an element.
    myVideo.muted = true; //The muted property sets or returns whether the audio/video should be muted (sound turned off).
   }
  }

   function endPlay() {
          // Reset the background color of the page when video is finished or stopped
          document.getElementsByTagName("body")[0].style.backgroundColor="#fff";
          var progress = document.getElementById("slideButton"); //Reset the slideButton when the page when video is finished or stopped
          progress.style.left="-10px";
        
          document.getElementById("start").disabled=false; //Reset the start button when the page when video is finished or stopped
          document.getElementById("pause").disabled=true; //Reset the pause button when the page when video is finished or stopped
          document.getElementById("stop").disabled=true; //Reset the stop button when the page when video is finished or stopped
       }

    function updateLoadStatus() { // function to update the loadStatus bar
          var loadStatusWidth = 500;
          var slideButtonWidth = 30;
          
          var time = Math.round(this.currentTime); // get current time
          
		//get the media play time , parseInt() function parses a string and returns an integer.
          var duration = parseInt(this.duration);  
		
          
          var position = loadStatusWidth * (time / duration); //calculate the position on the loadStatus bar
          if (isNaN(position)) { return; }
		      //The isNaN() function determines whether a value is an illegal number (Not-a-Number).
              //The function returns true if the value equates to NaN. Otherwise it returns false
          
          document.getElementById("loadStatus").style.width=position + "px"; //update the progress bar
          
          var slideButton = document.getElementById("slideButton"); // update the position of the slideButton
          if (position <= (loadStatusWidth - Math.round(slideButtonWidth / 2))) {
             slideButton.style.left=position + "px";
          } else {
             slideButton.style.left=loadStatusWidth - Math.round(slideButtonWidth / 2);
          }
       }

	