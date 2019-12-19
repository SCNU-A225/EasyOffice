drop database if exists oa;
create database oa;
use oa;

/*==============================================================*/
/* Table: claim_voucher       报销单                            */
/*
		id                   报销单号
		cause                报销事由
		create_sn            创建人
		create_time          创建时间
		next_deal_sn         待处理人
		total_amount         总金额
		status               状态
*/
/*==============================================================*/
create table claim_voucher
(
   id                   int not null auto_increment,
   cause                varchar(100),
   create_sn            char(5),
   create_time          datetime,
   next_deal_sn         char(5),
   total_amount         double,
   status               varchar(20),
   primary key (id)
);

/*==============================================================*/
/* Table: claim_voucher_item     报销单明细                     */
/*
	id                   编号
	claim_voucher_id     报销单号
	item                 类别（住宿/交通/餐饮等）
	amount               金额
	comment              描述（备注）
*/
/*==============================================================*/
create table claim_voucher_item
(
   id                   int not null auto_increment,
   claim_voucher_id     int,
   item                 varchar(20),
   amount               double,
   comment              varchar(100),
   primary key (id)
);

/*==============================================================*/
/* Table: deal_record           处理记录                        */
/*
	id                   编号
	claim_voucher_id     报销单号
	deal_sn              处理人
	deal_time            处理时间
	deal_way             处理类型（新建/提交/打回/通过等）
	deal_result          处理结果（新创建/已提交/已打回/已通过等）
	comment              备注
*/
/*==============================================================*/
create table deal_record
(
   id                   int not null auto_increment,
   claim_voucher_id     int,
   deal_sn              char(5),
   deal_time            datetime,
   deal_way             varchar(20),
   deal_result          varchar(20),
   comment              varchar(100),
   primary key (id)
);

/*==============================================================*/
/* Table: department            部门                            */
/*==============================================================*/
create table department
(
   sn                   char(5) not null,
   name                 varchar(20),
   address              varchar(100),
   primary key (sn)
);

/*==============================================================*/
/* Table: employee              员工                            */
/*==============================================================*/
create table employee
(
   sn                   char(5) not null,
   password             varchar(20),
   name                 varchar(20),
   department_sn        char(5),
   post                 varchar(20),
   primary key (sn)
);

alter table claim_voucher add constraint FK_Reference_2 foreign key (next_deal_sn)
      references employee (sn) on delete restrict on update restrict;

alter table claim_voucher add constraint FK_Reference_3 foreign key (create_sn)
      references employee (sn) on delete restrict on update restrict;

alter table claim_voucher_item add constraint FK_Reference_4 foreign key (claim_voucher_id)
      references claim_voucher (id) on delete restrict on update restrict;

alter table deal_record add constraint FK_Reference_5 foreign key (claim_voucher_id)
      references claim_voucher (id) on delete restrict on update restrict;

alter table deal_record add constraint FK_Reference_6 foreign key (deal_sn)
      references employee (sn) on delete restrict on update restrict;

alter table employee add constraint FK_Reference_1 foreign key (department_sn)
      references department (sn) on delete restrict on update restrict;

insert into department values('10001','总经理办公室','星星大厦E座1201');
insert into department values('10002','财务部','星星大厦E座1202');
insert into department values('10003','事业部','星星大厦E座1101');

insert into employee values('10001','000000','刘备','10001','总经理');
insert into employee values('10002','000000','孙尚香','10002','财务');
insert into employee values('10003','000000','关羽','10003','部门经理');
insert into employee values('10004','000000','周仓','10003','员工');
