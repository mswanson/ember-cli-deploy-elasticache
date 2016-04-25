/* jshint node: true */
/* NOTE: Props to https://github.com/uzysjung/uzys-elasticache-tunnel for much inspiration for this code */
'use strict';

const Promise      = require('ember-cli/lib/ext/promise');
const childProcess = require('child-process-es6-promise');

module.exports = class Tunnel {
  constructor(options) {
    this.config = {
      srcPort: options.srcPort,
      ec2User: options.ec2User,
      ec2Host: options.ec2Host,
      ec2KeyFile: options.ec2KeyFile,
      elasticachePort: options.elasticachePort,
      elasticacheHost: options.elasticacheHost,
      processName: options.srcPort + ':' + options.elasticacheHost + ':' + options.elasticachePort + ' ' + options.ec2User + '@' + options.ec2Host
    };
  }

  open() {
    return new Promise((resolve, reject) => {
      const tunnelCmd = 'ssh -2 -f -N -i ' + this.config.ec2KeyFile + ' -L' + this.config.srcPort + ':' + this.config.elasticacheHost + ':' + this.config.elasticachePort + ' ' + this.config.ec2User + '@' + this.config.ec2Host;
      const processCmd = "ps aux | grep -v awk | awk '/"+ this.config.processName +"/'";
      // start the ssh tunnel
      childProcess.exec(tunnelCmd);
      // verify that the tunnel process is running
      childProcess.exec(processCmd).then((data) => {
        // console.log(data.stdout);
        if(data.stdout !== '') {
          resolve();
        } else {
          reject('ssh tunnel not found!');
        }
      }).catch((error) => {
        // console.log(error);
        reject(error);
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      const processCmd = "ps aux | grep -v awk | awk '/ssh -2 -f -N -i/ {print $2}'";
      childProcess.exec(processCmd).then((data) => {
        data.stdout.split("\n").forEach((pid) => {
          if(pid !== '') {
            // console.log(`killing pid: ${pid}`);
            childProcess.execSync(`kill -9 ${pid}`);
          }
        });
        resolve();
      }).catch((error) => {
        reject(error);
      });
    });
  }
};
