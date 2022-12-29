<template>
  <div class="report-sidebar">
    <a
      type="button"
      class="btn btn-primary text-light"
      data-toggle="modal"
      data-target=".issue"
      @click="OpenReportIssue"
    >
      <span class="fa fa-bug"></span>&nbsp;&nbsp;Report an issue</a
    >
  </div>
  <div
    v-if="report_open"
    aria-hidden="true"
    aria-labelledby="mySmallModalLabel"
    class="modal fade issue"
    role="dialog"
    tabindex="-1"
  >
    <div class="modal-dialog modal-sm">
      <div class="modal-content">
        <div class="container my-2">
          <button
            type="button"
            class="close"
            data-dismiss="modal"
            aria-label="Close"
            @click="CloseReportIssue"
          >
            <span aria-hidden="true">&times;</span>
          </button>
          <div class="container text-center">
            <h4>Report an issue</h4>
          </div>
          <hr />
          <div id="result" class="container my-2 text-center" :class="tick"></div>
          <label v-if="report_label" id="report-label" style="font-weight: lighter"
          ><b>Describe your issue:</b></label
          >
          <div class="form-group">
                        <textarea
                          v-if="issuetext"
                          v-model="issueText"
                          class="form-control border-primary"
                          rows="3"
                        ></textarea>
          </div>
          <label
            v-if="email_label"
            style="font-weight: lighter"
          ><b>Email</b><span> [Optional]</span>:</label
          >
          <div class="form-group">
            <input
              v-if="emailtext"
              v-model="emailText"
              class="form-control border-primary"
              type="email"
              rows="3"
            />
          </div>
          <div class="container">
            <center>
              <button
                v-if="report"
                id="report"
                type="submit"
                class="btn btn-primary"
                @click="Report"
              >
                Report
              </button>
            </center>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import {generateSaveData , generateImage} from "#/simulator/src/data/save";

export default defineComponent({
  name:"ReportIssue",
  data(){
    return{
      report_open : false,
      issueText : "",
      emailText: "",
      issuetext: false,
      emailtext: false,
      report:false,
      report_label:false,
      email_label:false,
      tick:"",
    }
  },
  methods:{
    OpenReportIssue(){
      if(!this.report_open){
        this.report_open=true;
      }
      this.report_label=true;
      this.report=true;
      this.issuetext=true;
      this.emailtext=true;
      this.email_label=true;
      document.getElementById('result').innerText = '';
      this.tick="";
  },
  CloseReportIssue(){
    if(this.report_open){
      this.report_label=false;
      this.report=false;
      this.issuetext=false;
      this.emailtext=false;
      this.email_label=false;
    }
  },
  Report(){
      let message = this.issueText;
      let email = this.emailText;
      message+= '\nEmail:' + email;
      message+= '\nURL:' + window.location.href;
      message+= `\nUser Id: ${window.user_id}`
      this.postUserIssue(message);
      this.CloseReportIssue();
      this.issueText= "";
      this.emailText= "";
    },
    async postUserIssue(message){
      let img = generateImage('jpeg', 'full', false, 1, false).split(',')[1];
      let result
      try{
        result = await fetch('https://api.imgur.com/3/image',{
          method:'POST',
          headers:{
            Authorization: 'Client-ID 9a33b3b370f1054'
          },
          body:JSON.stringify({
            image:img,
          }),
        })
      }catch (err){
        console.error('Could not generate image, reporting anyway');
      }
      // if(result){
      //   message+= '\n' + result.data.link;
      // }
      let circuitData
      try{
        circuitData = generateSaveData('Untitled');
      }catch (err){
        circuitData= `Circuit data generation failed: ${err}`;
      }

      await fetch('/simulator/post_issue',{
        method: 'POST',
        headers: {
          'X-CSRF-Token':'content'
        },
        body: JSON.stringify({
          text:message,
          circuit_data:circuitData,
        }),
      }).then((response)=>{
        if(response.status==404){
          document.getElementById('result').innerText = 'There seems to be a network issue. Please reach out to us at support@ciruitverse.org';
          this.tick='fa fa-check colorChangeRed'
        }
        else{
        document.getElementById('result').innerText = 'You\'ve successfully submitted the issue. Thanks for improving our platform.';
        this.tick='fa fa-check colorChangeGreen'
        }
      }).catch((err)=>{
        document.getElementById('result').innerText = 'There seems to be a network issue. Please reach out to us at support@ciruitverse.org';
        this.tick='fa fa-check colorChangeRed'
      })
    }
  }
})
</script>
<style>
.colorChangeGreen{
  color: green;
}
.colorChangeRed{
  color: red;
}
</style>
