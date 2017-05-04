//index.js

var { monthFormatList, dayFormatList, APIS } = require('../../const');

var util = require('../../utils/util');
var user = require('../../libs/user');
var { request } = require('../../libs/request');

//获取应用实例
var app = getApp();

Page({
  data: {
    footerConfig: {
      pageEvent: true
    },
    year: 0,
    month: 0,
    formatedMonth: '',
    date: 0,
    todayDate: 0,
    events: [],
    eventDays: [],
    isShowSimpleCal: 'none',
    onBindScroll: '',
    toggleCalBundary: 0,
    calendar: [],
    scrollIntoViewId: '',
    screenWidth: 0,
    scrollLeft: 0,
    verticalScrollAnim: false,
    filterMaskAnim: {},
    filterPanelAnim: {},
    filterMaskDisplay: 'none',
    eventTypeList: [
      {typeId: '', typeName: '全部'}
    ],
    eventTypeIndex: 0,
    publisherTypeList: [
      {roleId: '', roleName: '全部'}
    ],
    publisherTypeIndex: 0
  },
  //事件处理函数
  bindViewTap: function() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },

  onLoad: function () {
    wx.showLoading({
      mask: true,
      title: '数据加载中'
    });
    
  },

  onShow: function() {
    user.login(this.renderUI, this, true);
  },

  renderUI: function () {
    this.setData({
      screenWidth: wx.getSystemInfoSync().screenWidth
    });
    this.getCurrentDate();
    this.getEventList();
    this.getFilterTypes();
    this.createAnim();
  },

  getEventList: function() {
    var that = this;
    var et = this.data.eventTypeList;
    var ei = this.data.eventTypeIndex;
    var pt = this.data.publisherTypeList;
    var pi = this.data.publisherTypeIndex;
    request({
      url: APIS.GET_EVENTS_LIST_BY_MONTH,
      data: {
        year: this.data.year,
        month: this.data.month,
        offset: 0,
        size: 9999,
        eventType: et[ei].typeId,
        publisherType: pt[pi].roleId,
        sid: wx.getStorageSync('sid')
      },
      method: 'POST',
      realSuccess: function(data){
        var list = data.list;
        list = list.map(function(e, i) {
          e.dayName = dayFormatList[e.day].chi;
          if (i == 0 || e.date != list[i-1].date) {
            e.isFirstEventInDay = true;
          }
          return e;
        });
        that.setData({
          events: list,
          eventDays: data.eventDays
        });
        wx.hideLoading();
        if (list.length == 0) {
          wx.showToast({
            title: '当前月份没有事件！'
          });
        }
        that.renderCalendar();
      },
      loginCallback: this.getEventList,
      realFail: function(msg) {
        wx.hideLoading();
        wx.showToast({
          title: msg
        });
      }
    }, true, this);
/*
    var events = require('../../mocks/getEventList');
    var list = events.list;
    setTimeout(function() {
      list = list.map(function(e, i) {
        e.dayName = dayFormatList[e.day].chi;
        if (i == 0 || e.date != list[i-1].date) {
          e.isFirstEventInDay = true;
        }
        return e;
      });
      that.setData({
        events: list,
        eventDays: events.eventDays
      });
      wx.hideLoading();
      that.renderCalendar();
    }, 1000);
    */
  },

  getFilterTypes: function() {
    var that = this;
    request({
      url: APIS.GET_EVENT_TYPE_LIST,
      method: 'GET', 
      realSuccess: function(data){
        var list = data.list;
        that.setData({
          eventTypeList: that.data.eventTypeList.concat(list)
        });
      }
    }, false);
    request({
      url: APIS.GET_ROLE_LIST,
      method: 'GET', 
      realSuccess: function(data){
        var list = data.list;
        that.setData({
          publisherTypeList: that.data.publisherTypeList.concat(list)
        });
      }
    }, false);
  },

  getCurrentDate: function() {
    var today = new Date();
    this.setData({
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      formatedMonth: monthFormatList[today.getMonth()].eng,
      date: today.getDate(),
      todayDate: today.getDate()
    });
  },

  renderCalendar: function() {
    var cal = util.getCalByDate(
      this.data.year,
      this.data.month,
      this.data.date
    );

    var that = this;
    var currentOffset = 0;
    cal[cal.length - 14].initPos = 'initPos';
    cal = cal.map(function(d, i) {
      d.offsetLeft = that.data.screenWidth / 7 * i;
      if (d.mode == 'current' && d.date == that.data.date) {
        // 当前周的第一天滚动到最左边
        currentOffset = cal[i - ( i % 7 )].offsetLeft;
      }
      // 判断该日期下是否有事件
      if (d.mode == 'current') {
        if (util.inArray(d.date, that.data.eventDays)) {
          d.hasEvents = true;
        }
      }
      return d;
    });

    this.setData({
      calendar: cal,
      //isShowSimpleCal: 'block',
      verticalScrollAnim: false
    });
    setTimeout(function() {
      that.setData({
        scrollLeft: currentOffset,
        scrollIntoViewId: 'initPos',
        onBindScroll: 'onInitScroll'
      });
    }, 0);

  },

  // 通过这里获取垂直scroll的初始偏移量，用于后续水平scroll的显示toggle处理
  onInitScroll: function(e) {
    var that = this;
    this.setData({
      toggleCalBundary: e.detail.scrollTop,
      onBindScroll: 'onBindScroll',
      verticalScrollAnim: true,
      isShowSimpleCal: 'block'
    });
    setTimeout(function() {
      that.setData({
        scrollIntoViewId: 'anchor' + that.data.date
      });
    }, 0);
  },

  onBindScroll: function(e) {
    if (e.detail.scrollTop < this.data.toggleCalBundary) {
      this.setData({
        isShowSimpleCal: 'none'
      });
    } else {
      this.setData({
        isShowSimpleCal: 'block'
      });
    }
  },

  // 通过日期选择器修改日期
  bindDateChange: function(e) {
    var dateArr = e.detail.value.split('-');
    this.setData({
      year: +dateArr[0],
      month: +dateArr[1],
      date: +dateArr[2],
      formatedMonth: monthFormatList[+dateArr[1]-1].eng
    });
    
    this.getEventList();
    //this.renderCalendar();
  },

  // 点击日历修改日期
  onSelectDate: function(e) {
    var date = e.target.dataset.date;
    if (!util.inArray(date, this.data.eventDays)) {
      wx.showToast({
        title: '该日期没有事件！'
      });
    } else {
      var offset = 0;
      var that = this;
      this.data.calendar.forEach(function(d, i) {
        if (d.mode == 'current' && d.date == date) {
          offset = that.data.calendar[i - ( i % 7 )].offsetLeft;
          return false;
        }
      });
      this.setData({
        //scrollLeft: offset,
        scrollIntoViewId: 'anchor' + date,
        date: date
      });
      setTimeout(function() {
        that.setData({
          scrollLeft: offset
        });
      }, 500);
    }
  },

  createAnim: function() {
    var that = this;
    this.filterMaskAnim = wx.createAnimation({
      duration: 400,
      timingFunction: 'ease'
    });
    this.filterPanelAnim = wx.createAnimation({
      duration: 400,
      timingFunction: 'ease'
    })
  },

  // 点击更多筛选条件
  onTapFilterMore: function() {
    this.setData({
      filterMaskDisplay: 'block'
    });
    this.filterMaskAnim.opacity(0.5).step();
    this.filterPanelAnim.right(0).step();
    this.setData({
      filterMaskAnim: this.filterMaskAnim.export(),
      filterPanelAnim: this.filterPanelAnim.export()
    });
  },

  // 关闭更多筛选面板
  onCloseFilterPanel: function() {
    var that = this;
    this.filterMaskAnim.opacity(0).step();
    this.filterPanelAnim.right('-80%').step();
    this.setData({
      filterMaskAnim: this.filterMaskAnim.export(),
      filterPanelAnim: this.filterPanelAnim.export()
    });
    setTimeout(function() {
      that.setData({
        filterMaskDisplay: 'none'
      });
    }, 400);
  },

  onChangeEventType: function(e) {
    this.setData({
      eventTypeIndex: +e.detail.value
    });
  },

  onChangePublisherType: function(e) {
    this.setData({
      publisherTypeIndex: +e.detail.value
    });
  },

  onSubmitFilterMore: function() {
    this.getEventList();
    this.onCloseFilterPanel();
  },

  onResetFilterMore: function() {
    this.setData({
      eventTypeIndex: 0,
      publisherTypeIndex: 0
    });
  }
})
