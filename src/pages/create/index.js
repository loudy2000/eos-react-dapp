import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { Row, Col, Form, Input, Upload, Button, Radio, message, notification } from 'antd';

import BraftEditor from 'braft-editor';
import 'braft-editor/dist/index.css';
import * as utils from '../../common/utils';
import * as bcUtils from '../../bc/bcUtils';
import * as actionCreator from '../../store/actionCreator';

class Create extends Component {

  state = {
    toHome: false,    //是否跳转到首页
    editorState: BraftEditor.createEditorState(),
    title: '',        //标题
    cover: '',        //封面图hash
    category: 1,      //类型
  }

  constructor(props){
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleEditorChange = this.handleEditorChange.bind(this);
    this.handlePreview = this.handlePreview.bind(this);
    this.handleUpload = this.handleUpload.bind(this);
  }

  componentWillMount(){
    this.props.changeLayoutBackground();
  }

  verify(){
    if(!this.props.account){
      notification.error({
        message: '您还没有登录',
        description: '请安装Scatter或登录EOS账户',
      });
      return false;
    }
    if(!this.state.title){
      message.error('标题不能为空');
      return false;
    }
    if(!this.state.cover){
      message.error('请上传封面图');
      return false;
    }
    return true;
  }

  async handleSubmit(e){  
    e.preventDefault();

    if(this.verify()){
      const summary = this.state.editorState.toRAW(true).blocks[0].text;
      const user = this.props.account;
      const title = this.state.title;
      const category = this.state.category;
      const cover = this.state.cover;
      const content = await bcUtils.saveTextToIPFS(this.state.editorState.toHTML());
      const contentj = await bcUtils.saveTextToIPFS(this.state.editorState.toRAW())

      const data = {
        user, 
        title, 
        summary: utils.cutString(summary, 200),
        timestamp : new Date().getTime(),
        category, 
        cover, 
        content, 
        contentj,
      }
      bcUtils.eosTransact('create', data, () => {
        this.setState({toHome: true});
      });
    }
  }

  handleInputChange(e){
    this.setState({[e.target.name]: e.target.value});
  }

  handleEditorChange(editorState){
    this.setState({editorState});
  }

  handlePreview(){
    if (window.previewWindow) {
      window.previewWindow.close();
    }
    window.previewWindow = window.open();
    window.previewWindow.document.write(
      utils.buildPreviewHtml(this.state.editorState.toHTML())
    );
    window.previewWindow.document.close();
  }

  async handleUpload(file){
    if (!file.type.startsWith('image/')) {
      message.error('只能上传图片');
      return false;
    }
    const hash = await bcUtils.saveFileToIPFS(file);
    this.setState({cover:hash});
    return false;
  }

  render(){
    if(this.state.toHome){
      return <Redirect to='/'></Redirect>

    }else{
      const extendControls = [
        {
          key: 'custom-button',
          type: 'button',
          text: '立即预览',
          onClick: this.handlePreview,
        }
      ];

      return <Row
        type='flex'
        justify='center'
        style={{marginTop:'30px'}}
      >
        <Col span={20}>
          <Form onSubmit={this.handleSubmit}>
            <Form.Item label='标题'>
              <Input name='title' onChange={this.handleInputChange}/>
            </Form.Item>
            <Form.Item label='内容'>
              <BraftEditor
                value={this.state.editorState}
                extendControls={extendControls}
                onChange={this.handleEditorChange}
              />          
            </Form.Item>
            <Form.Item label='封面'>
              <Upload
                beforeUpload={this.handleUpload}
                showUploadList={false}
                accept='image/*'
              >
                { 
                  this.state.cover 
                  ? <img src={`${bcUtils.ipfsUrl(this.state.cover)}`} alt=''/> 
                  : <Button type="primary" shape="round" icon="upload">上传</Button>
                }
              </Upload>  
            </Form.Item>
            <Form.Item label='选择版块'>
              <Radio.Group
                name='category' 
                defaultValue={1} 
                buttonStyle='solid'
                onChange={this.handleInputChange}
              >
                <Radio.Button value={1}>教程技巧</Radio.Button>
                <Radio.Button value={2}>软件分享</Radio.Button>
                <Radio.Button value={3}>美图精选</Radio.Button>
                <Radio.Button value={4}>视频空间</Radio.Button>
                <Radio.Button value={5}>网站推荐</Radio.Button>
                <Radio.Button value={6}>其他资源</Radio.Button>
              </Radio.Group>    
            </Form.Item>
            <Form.Item>
              <Button type='primary' htmlType='submit'>提交</Button>
            </Form.Item>
          </Form>
        </Col>
      </Row>
    }
  }

}

const mapState = (state) => ({
  account: state.account,
});

const mapDispatch = (dispatch) => ({
  changeLayoutBackground(){
    dispatch(actionCreator.changeLayoutBackground('#f0f2f5'));
  },
});

export default connect(mapState, mapDispatch)(Create);